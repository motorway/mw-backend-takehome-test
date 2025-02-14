import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

interface getUrlParams {
    path: string,
    method: string,
    params?: Record<string, unknown>,
    body?: unknown
}

export interface RedisService {
    client: Redis,
    getUrl: <T>(prefix: string, key: string) => Promise<T | null>,
    setUrl: (prefix: string, key: string, response: unknown, ttl?: number) => Promise<void>
    hash: (req: getUrlParams) => string
}

async function redisService(fastify: FastifyInstance) {
    const ttlDefaultWindow = 5; // 5s 

    const redis = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    });

    const hashFn = (req: getUrlParams) => {
        const sortedParams = JSON.stringify(req, Object.keys(req).sort());
        // Hash the sorted string
        return crypto.createHash('sha256').update(sortedParams).digest('hex');

    }

    const serviceInstance: RedisService = {
        client: redis,
        getUrl: async <T>(prefix: string, key: string) => {
            try {

                const value = await redis.get(`${prefix}:${key}`);
                return JSON.parse(value!) as T;

            } catch (err) {
                fastify.log.error(err);
            }
            return null;
        },
        hash: hashFn,
        setUrl: async (prefix: string, key: string, response: unknown, ttl = ttlDefaultWindow) => {
            try {
                const value = JSON.stringify(response);
                await redis.setex(`${prefix}:${key}`, ttl, value);
            } catch (err) {
                fastify.log.error(err);
            }
        }

    }

    fastify.decorate('redisService', serviceInstance);

    redis.on('error', (err) => {
        fastify.log.error(`Redis error: ${err}`);
    });

    fastify.addHook('onClose', async () => {
        await redis.quit();
    });

}

export default fp(redisService, {
    name: 'redisService'
});
