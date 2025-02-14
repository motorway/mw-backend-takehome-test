import axios from 'axios';
import { FastifyBaseLogger } from 'fastify';
import { Counter } from 'prom-client';
import {
    Mocked,
    vi,
} from 'vitest';
import { fastify } from '~root/test/fastify';

import { VehicleValuation } from '@app/models/vehicle-valuation';
import { RedisService } from '@app/services/redis/redis.service';
import { SuperCarService } from '@app/services/super-car/super-car.service';

import { SupervisorService } from '../supervisor.service';

vi.mock('axios');

describe('SupervisorService', () => {
    let supervisorServiceInstance: SupervisorService;

    const mockRequestPremiumCar = vi.fn();
    const mockRequestSuperCar = vi.fn();
    const redisSetUrlMock = vi.fn().mockImplementation(async () => { });
    const redisGetUrlMock = vi.fn().mockImplementation(() => {
        return null
    });

    const loggerMock = {
        error: vi.fn(),
    } as unknown as Mocked<FastifyBaseLogger>;

    const cntGet = vi.fn();

    const reqCnt = {
        get: cntGet,
        inc: vi.fn(),
    } as unknown as Counter;


    beforeAll(async () => {
        fastify.log = loggerMock;
        fastify.premiumCarService = { request: mockRequestPremiumCar };
        fastify.superCarService = { request: mockRequestSuperCar, reqCnt } as unknown as SuperCarService;
        fastify.redisService = { setUrl: redisSetUrlMock, getUrl: redisGetUrlMock, hash: vi.fn().mockImplementation(() => `key`) } as unknown as RedisService;

        supervisorServiceInstance = fastify.supervisorService;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('request', () => {
        const vrm = 'ABC1234567'
        const mileage = 2;
        const mockEvalSuper = <VehicleValuation>{
            highestValue: 1,
            lowestValue: 3,
            provider: 'supercar',
            vrm: vrm
        };

        const mockEvalPremium = <VehicleValuation>{
            highestValue: 1,
            lowestValue: 3,
            provider: 'premiumcar',
            vrm: vrm
        };

        // cache entry present
        it('return cache', async () => {
            redisGetUrlMock.mockImplementationOnce(() => {
                return mockEvalSuper
            })
            const result = await supervisorServiceInstance.request(vrm, mileage);
            expect(result).toEqual(mockEvalSuper);
        })

        describe('no failover state', () => {
            it('super car ok', async () => {
                // vi.mocked(axios.get).mockResolvedValueOnce(mockEvalSuper);
                mockRequestSuperCar.mockResolvedValueOnce(mockEvalSuper);
                const result = await supervisorServiceInstance.request(vrm, mileage);
                expect(result).toEqual(mockEvalSuper);
                expect(redisSetUrlMock).toBeCalledWith(
                    `req:super/valuations/${vrm}/${mileage}`,
                    `key`,
                    {
                        "highestValue": 1,
                        "lowestValue": 3,
                        "provider": "supercar",
                        "vrm": `${vrm}`,
                    }
                );
            })

            it('super car fail, premium ok', async () => {
                mockRequestSuperCar.mockImplementationOnce(() => { throw new Error("forced") });
                mockRequestPremiumCar.mockResolvedValueOnce(mockEvalPremium);
                const result = await supervisorServiceInstance.request(vrm, mileage);
                expect(result).toEqual(mockEvalPremium);
                expect(redisSetUrlMock).toBeCalledWith(
                    `req:super/valuations/${vrm}/${mileage}`,
                    `key`,
                    {
                        "highestValue": 1,
                        "lowestValue": 3,
                        "provider": "premiumcar",
                        "vrm": `${vrm}`,
                    }
                );
            })

            it('super car fail, premium fail', async () => {
                mockRequestSuperCar.mockImplementationOnce(() => { throw new Error("forced") });
                mockRequestPremiumCar.mockImplementationOnce(() => { throw new Error("forced") });
                await expect(supervisorServiceInstance.request(vrm, mileage)).rejects.toThrow();
            })
        });

        describe('failover state', () => {
            it('super car ignored, premium ok', async () => {
                supervisorServiceInstance.resetFailoever(Date.now() + 1000 * 60 * 60 * 24);
                mockRequestSuperCar.mockResolvedValueOnce(mockEvalSuper);
                mockRequestPremiumCar.mockResolvedValueOnce(mockEvalPremium);

                const result = await supervisorServiceInstance.request(vrm, 1);
                expect(result).toEqual(mockEvalPremium);

                expect(mockRequestSuperCar).not.toHaveBeenCalled();
            })

            it('super car ignored, premium fail', async () => {
                supervisorServiceInstance.resetFailoever(Date.now() + 1000 * 60 * 60 * 24);
                mockRequestSuperCar.mockResolvedValueOnce(mockEvalSuper);

                mockRequestPremiumCar.mockImplementationOnce(() => { throw new Error("forced") });
                await expect(supervisorServiceInstance.request(vrm, mileage)).rejects.toThrow();

                expect(mockRequestSuperCar).not.toHaveBeenCalled();
            })
        });
    })

    describe('promCheck', () => {

        it('should skip if number of request is below the init threshold', async () => {
            supervisorServiceInstance.resetMinApiRequest(10);
            supervisorServiceInstance.resetFailoever(0);

            const axiosSpy = vi.spyOn(axios, 'get');
            cntGet.mockImplementation(async () => {
                // reqCntRef.values?.[0]?.value
                return { values: [{ value: 0 }] };
            })

            await supervisorServiceInstance.promCheck();
            expect(supervisorServiceInstance.failoverActiveUntil()).toEqual(0);
            expect(axiosSpy).not.toBeCalled();
        });

        it('should check error rate (below 50) ', async () => {
            supervisorServiceInstance.resetMinApiRequest(10);
            supervisorServiceInstance.resetFailoever(0);

            vi.mocked(axios.get).mockResolvedValueOnce({
                data: {
                    data: {
                        result: [{ value: [0, "49"] }],
                    },
                },
            });
            cntGet.mockImplementation(async () => {
                return { values: [{ value: 11 }] };
            })

            await supervisorServiceInstance.promCheck();
            expect(supervisorServiceInstance.failoverActiveUntil()).toEqual(0);
            expect(axios.get).toBeCalled();
        });

        it('should check error rate (above 50)', async () => {
            supervisorServiceInstance.resetMinApiRequest(10);
            supervisorServiceInstance.resetFailoever(0);

            vi.mocked(axios.get).mockResolvedValueOnce({
                data: {
                    data: {
                        result: [{ value: [0, "51"] }],
                    },
                },
            });
            cntGet.mockImplementation(async () => {
                return { values: [{ value: 11 }] };
            })

            await supervisorServiceInstance.promCheck();
            expect(supervisorServiceInstance.failoverActiveUntil()).toBeTruthy();
            expect(axios.get).toBeCalled();
        });

    });


});
