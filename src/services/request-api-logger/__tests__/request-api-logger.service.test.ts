import {
    AxiosError,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { FastifyBaseLogger } from 'fastify';
import {
    Mocked,
    vi,
} from 'vitest';
import { fastify } from '~root/test/fastify';

import { providerEnum } from '@app/models/provider-logs';

import { RequestApiLoggerService } from '../request-api-logger.service';

vi.mock('axios');

describe('requestApiLoggerService', () => {
    let requestApiLoggerServiceInstance: RequestApiLoggerService;

    const providerInsert = vi.fn().mockImplementation(async () => {
        return () => { };
    });

    const loggerMock = {
        error: vi.fn()
    } as unknown as Mocked<FastifyBaseLogger>

    beforeAll(async () => {
        fastify.log = loggerMock;
        fastify.orm.getRepository = vi.fn().mockImplementation(() => {
            return {
                insert: providerInsert,
            }
        });

        requestApiLoggerServiceInstance = fastify.requestApiLoggerService;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should log request details when Axios request succeeds', async () => {
        const mockAxiosResponse = {
            status: 200,
            data: { message: 'success' },
        } as AxiosResponse;

        const mockRequest = vi.fn().mockResolvedValue(mockAxiosResponse);

        const url = 'https://api.example.com';
        const provider = 'premiumcar' as providerEnum;
        const vrm = 'ABC123';

        const response = await requestApiLoggerServiceInstance.aroundAxios(mockRequest(), url, provider, vrm);

        expect(response).toEqual(mockAxiosResponse);
        expect(providerInsert).toHaveBeenCalledTimes(1);
        expect(providerInsert).toHaveBeenCalledWith(expect.objectContaining({
            provider,
            url,
            code: 200,
            vrm,
            durationInMilliseconds: expect.any(Number),
            error: undefined,
        }));
    });

    it('should log error details when Axios request fails', async () => {
        const mockAxiosError = new AxiosError('Request failed', '500');
        mockAxiosError.response = { status: 500 } as AxiosResponse;

        const mockRequest = vi.fn().mockRejectedValue(mockAxiosError);

        const url = 'https://api.example.com';
        const provider = 'premiumcar' as providerEnum;
        const vrm = 'ABC123';

        try {
            await requestApiLoggerServiceInstance.aroundAxios(mockRequest(), url, provider, vrm);
        } catch (error) {
            expect(error).toBe(mockAxiosError);
            expect(providerInsert).toHaveBeenCalledTimes(1);
            expect(providerInsert).toHaveBeenCalledWith(expect.objectContaining({
                provider,
                url,
                code: 500,
                vrm,
                durationInMilliseconds: expect.any(Number),
                error: mockAxiosError.message,
            }));
        }
    });

    it('should handle Axios error when response status is missing', async () => {
        const mockAxiosError = new AxiosError('Request failed', '500', <InternalAxiosRequestConfig>{});
        const mockRequest = vi.fn().mockRejectedValue(mockAxiosError);

        const url = 'https://api.example.com';
        const provider = 'premiumcar' as providerEnum;
        const vrm = 'ABC123';

        try {
            await requestApiLoggerServiceInstance.aroundAxios(mockRequest(), url, provider, vrm);
        } catch (error) {
            expect(error).toBe(mockAxiosError);
            expect(providerInsert).toHaveBeenCalledWith(expect.objectContaining({
                provider,
                url,
                code: 500,
                vrm,
                durationInMilliseconds: expect.any(Number),
                error: mockAxiosError.message,
            }));
        }
    });

    it('should log the error when inserting logs fails', async () => {
        providerInsert.mockImplementationOnce(async () => {
            throw new Error('Database error')
        });

        const mockAxiosResponse = {
            status: 200,
            data: { message: 'success' },
        } as AxiosResponse;

        const mockRequest = vi.fn().mockResolvedValue(mockAxiosResponse);

        const url = 'https://api.example.com';
        const provider = 'premiumcar' as providerEnum;
        const vrm = 'ABC123';

        await requestApiLoggerServiceInstance.aroundAxios(mockRequest(), url, provider, vrm);

        expect(fastify.log.error).toHaveBeenCalledWith(
            "Log insert error",
            new Error('Database error'),
        );
    });
});