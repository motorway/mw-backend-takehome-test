import crypto from 'crypto';
import { FastifyBaseLogger } from 'fastify';
import Redis from 'ioredis';
import {
    Mocked,
    vi,
} from 'vitest';
import { fastify } from '~root/test/fastify';

import { RedisService } from '../redis.service';

vi.mock('ioredis');
vi.mock('crypto');

describe('redisService', () => {
    let redisServiceInstance: RedisService;
    let redisMock: Mocked<Redis>;
    const loggerMock = {
        error: vi.fn()
    } as unknown as Mocked<FastifyBaseLogger>

    beforeAll(async () => {
        crypto.createHash = vi.fn().mockReturnValue({
            update: vi.fn().mockReturnThis(),
            digest: vi.fn().mockReturnValue('mockedhash'),
        });

        redisServiceInstance = fastify.redisService;
        redisMock = (redisServiceInstance.client as Mocked<Redis>)
        fastify.log = loggerMock;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a hash from request parameters', () => {
        const req = { path: '/test', method: 'GET', params: { id: 123 }, body: { name: 'John' } };
        const hash = redisServiceInstance.hash(req);

        expect(hash).toBe('mockedhash');
        expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });

    it('should get data from Redis using getUrl', async () => {
        redisMock.get.mockResolvedValueOnce('{"someKey":"someValue"}');

        const result = await redisServiceInstance.getUrl('prefix', 'key');
        expect(redisMock.get).toHaveBeenCalledWith('prefix:key');
        expect(result).toEqual({ someKey: 'someValue' });
    });

    it('should return null if Redis get fails in getUrl', async () => {
        redisMock.get.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisServiceInstance.getUrl('prefix', 'key');
        expect(result).toBeNull();
        expect(loggerMock.error).toHaveBeenCalled();
    });

    it('should set data in Redis using setUrl', async () => {
        redisMock.setex.mockResolvedValueOnce('OK');

        const response = { someKey: 'someValue' };
        await redisServiceInstance.setUrl('prefix', 'key', response, 10);

        expect(redisMock.setex).toHaveBeenCalledWith('prefix:key', 10, '{"someKey":"someValue"}');
    });

    it('should handle errors when setting data in Redis', async () => {
        redisMock.setex.mockRejectedValueOnce(new Error('Redis error'));

        const response = { someKey: 'someValue' };
        await redisServiceInstance.setUrl('prefix', 'key', response);

        expect(fastify.log.error).toHaveBeenCalledWith(expect.any(Error));
    });

});
