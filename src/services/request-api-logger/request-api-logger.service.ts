import {
    AxiosError,
    AxiosResponse,
} from 'axios';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import {
    providerEnum,
    ProviderLogs,
} from '@app/models/provider-logs';

export interface RequestApiLoggerService {
    loggerApi: (args: {
        vrm: string,
        provider: providerEnum,
        url: string,
        code: number,
        date: Date,
        durationInMilliseconds: number,
        error?: Error | AxiosError
    }) => void,


    aroundAxios<T>(
        requestPromise: Promise<AxiosResponse<T>>,
        url: string,
        provider: providerEnum,
        vrm: string
    ): Promise<AxiosResponse<T>>;
}

async function requestApiLoggerService(fastify: FastifyInstance) {

    const loggerApi = async (args: {
        vrm: string,
        provider: providerEnum,
        url: string,
        code: number,
        date: Date,
        durationInMilliseconds: number,
        error?: Error | AxiosError
    }) => {
        const repo = fastify.orm.getRepository(ProviderLogs);

        const log = new ProviderLogs();
        log.provider = args.provider;
        log.url = args.url;
        log.code = args.code;
        log.date = args.date;
        log.durationInMilliseconds = args.durationInMilliseconds;
        log.vrm = args.vrm;
        log.error = (args.error as AxiosError)?.request?.status || args.error?.message;


        await repo.insert(log).catch(err => {
            fastify.log.error('Log insert error', err);
        });
    }

    async function aroundAxios<T>(
        requestPromise: Promise<AxiosResponse<T>>,
        url: string,
        provider: providerEnum,
        vrm: string
    ): Promise<AxiosResponse<T>> {
        const t1 = Date.now();

        try {
            const response = await requestPromise;
            const t2 = Date.now();
            const durationInMilliseconds = t2 - t1;

            await loggerApi({
                code: response.status,
                date: new Date(),
                durationInMilliseconds,
                provider,
                vrm,
                url
            });

            return response;
        } catch (error) {
            const t2 = Date.now();
            const durationInMilliseconds = t2 - t1;

            await loggerApi({
                code: (error as AxiosError).response?.status ?? 500,
                date: new Date(),
                durationInMilliseconds,
                provider,
                vrm,
                url,
                error: error as AxiosError
            });

            throw error;
        }
    }


    const serviceInstance: RequestApiLoggerService = {
        aroundAxios,
        loggerApi
    };


    fastify.decorate('requestApiLoggerService', serviceInstance);
}

export default fp(requestApiLoggerService, {
    name: 'requestApiLoggerService',
});
