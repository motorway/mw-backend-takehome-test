import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { VehicleValuation } from '@app/models/vehicle-valuation';

import {
    PremiumCarValuationResponseFrom,
} from './types/super-car-valuation-response';

export interface PremiumCarService {
    request: (vrm: string) => Promise<VehicleValuation | undefined>
}

async function premiumCarService(fastify: FastifyInstance) {
    const baseDomain = process.env.PREMIUM_CAR_API;
    const parser = new XMLParser();

    const serviceInstance: PremiumCarService = {
        request: async (vrm: string) => {
            const url = `${baseDomain}/valueCar?vrm=${vrm}`;
            const response = await fastify.requestApiLoggerService.aroundAxios(
                axios.get<string>(
                    `${url}`,
                    {
                        headers: {
                            Accept: 'application/xml'
                        },
                        responseType: 'text',

                    }
                ),
                url,
                'premiumcar',
                vrm
            );

            const decoded = parser.parse(response.data.toString()) as PremiumCarValuationResponseFrom;

            const valuation = new VehicleValuation();

            valuation.vrm = vrm;
            valuation.lowestValue = decoded.Response.ValuationDealershipMinimum;
            valuation.highestValue = decoded.Response.ValuationDealershipMaximum;

            valuation.provider = 'premiumcar';

            return valuation;
        }

    };

    fastify.decorate('premiumCarService', serviceInstance);
}

export default fp(premiumCarService, {
    name: 'premiumCarService'
});
