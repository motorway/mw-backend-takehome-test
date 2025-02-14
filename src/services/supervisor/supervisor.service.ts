import axios from 'axios';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { VehicleValuation } from '@app/models/vehicle-valuation';

import {
    supercar_requests_errors_total,
    supercar_requests_total,
} from '../super-car/super-car.counter';
import { PromClientResponse } from './types/promClient- response';

export interface SupervisorService {
    failoverActiveUntil: () => number,
    resetFailoever: (newFailOverUntil: number) => void,
    resetMinApiRequest: (newMin: number) => void,
    request: (vrm: string, mileage: number) => Promise<VehicleValuation | undefined>,
    promCheck: () => Promise<void>
}

async function supervisorService(fastify: FastifyInstance) {
    let failOverUntil = 0; // unix timestamp stating untill when main api is avoided.
    let minApiRequestCnt = 2; // 10 how many requests to ignore before the polcy is applied
    const failoverWindowInMinutes = 15; // timeseries window for failsafe
    const failoverErrorRate = 50; // error rate for the redirect

    const promCheck = async () => {
        try {
            const reqCntRef = await fastify.superCarService.reqCnt.get();
            const totalCntState = reqCntRef.values?.[0]?.value;

            if (totalCntState < minApiRequestCnt) {
                return; //skip
            }

            const response = await axios.get<PromClientResponse>(
                `${process.env.PROMETHEUS_API}/api/v1/query`,
                {
                    params: {
                        query: `rate(${supercar_requests_errors_total}[${failoverWindowInMinutes}m]) / rate(${supercar_requests_total}[${failoverWindowInMinutes}m]) * 100`,

                    }
                }
            );

            if (response.data.data.result.length > 0) {
                const errorRate = Math.floor(Number(response.data.data.result[0].value?.[1]));

                if (errorRate > failoverErrorRate) { // turn of main api when the error rate is reached - and after some requests are done
                    failOverUntil = Date.now() + 1000 * 60 * failoverWindowInMinutes
                    // 15 minute backoff
                }
            }
        } catch (err) {
            fastify.log.error(err);
        }

    }

    const serviceInstance = {
        promCheck,
        failoverActiveUntil: () => {
            return failOverUntil;
        },
        resetFailoever: (newFailOverUntil: number) => {
            failOverUntil = newFailOverUntil
        },
        resetMinApiRequest: (newMin: number) => {
            minApiRequestCnt = newMin
        },
        request: async (vrm: string, mileage: number) => {

            const prefix = `req:super/valuations/${vrm}/${mileage}`;
            const cacheKey = fastify.redisService.hash({
                path: `valuations/${vrm}/${mileage}`,
                method: 'GET'
            });
            const cacheCandidate = await fastify.redisService.getUrl<VehicleValuation>(prefix, cacheKey)

            if (cacheCandidate) {
                return cacheCandidate;
            }

            if (failOverUntil < Date.now()) { // do not request the main api, if failsafe is switched on.
                try {
                    const result = await fastify.superCarService.request(vrm, mileage);
                    if (result) {
                        fastify.redisService.setUrl(prefix, cacheKey, result).finally(); // fire and forget
                    }

                    return result;
                } catch (err) {
                    // prom requst if the error is past the threshold
                    promCheck().finally(); // run async do not slow down requests
                }
            }

            const result = await fastify.premiumCarService.request(vrm);
            if (result) {
                fastify.redisService.setUrl(prefix, cacheKey, result).finally(); // fire and forget
            }
            return result;

        },
    } as SupervisorService;

    fastify.decorate('supervisorService', serviceInstance);
}

export default fp(supervisorService, {
    name: 'supervisorService'
});

