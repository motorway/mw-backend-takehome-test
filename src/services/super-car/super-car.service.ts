import axios from 'axios';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Counter } from 'prom-client';

import { VehicleValuation } from '@app/models/vehicle-valuation';

import {
    registerSuperCarRequestCnt,
    registerSuperCarRequestErrorCnt,
} from './super-car.counter';
import {
    SuperCarValuationResponse,
} from './types/super-car-valuation-response';

export interface SuperCarService {
    reqCnt: Counter;
    reqErrCnt: Counter;
    request: (vrm: string, mileage: number) => Promise<VehicleValuation | undefined>
}

async function superCarService(fastify: FastifyInstance) {
    const baseUrl = `${process.env.SUPER_CAR_API}`;
    const reqCnt = registerSuperCarRequestCnt();
    const reqErrCnt = registerSuperCarRequestErrorCnt();

    const fetchValuationFromSuperCarValuation = async (
        vrm: string,
        mileage: number,
    ) => {
        const url = `${baseUrl}/valuations/${vrm}?mileage=${mileage}`;

        const response = await fastify.requestApiLoggerService.aroundAxios(
            axios.get<SuperCarValuationResponse>(url),
            url,
            'supercar',
            vrm
        );

        const valuation = new VehicleValuation();

        valuation.vrm = vrm;
        valuation.lowestValue = response.data.valuation.lowerValue;
        valuation.highestValue = response.data.valuation.upperValue;
        valuation.provider = 'supercar';

        return valuation;
    }

    const serviceInstance: SuperCarService = {
        reqCnt,
        reqErrCnt,
        request: async (vrm: string,
            mileage: number,) => {
            try {
                reqCnt.inc();
                return await fetchValuationFromSuperCarValuation(vrm, mileage);
            } catch (error) {
                // TODO discus if maybe 404 and client erros should treated differently
                reqErrCnt.inc();
                throw error; // rethrow - make supervisor take deicssions
            }
        }
    };

    fastify.decorate('superCarService', serviceInstance);
}

// Export as a Fastify plugin
export default fp(superCarService, {
    name: 'superCarService'
});
