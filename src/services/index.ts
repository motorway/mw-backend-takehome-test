import { FastifyInstance } from 'fastify';

import premiumCarService from './premium-car/premium-car.service';
import redisService from './redis/redis.service';
import superCarService from './super-car/super-car.service';
import supervisorService from './supervisor/supervisor.service';
import requestApiLoggerService from './request-api-logger/request-api-logger.service';

export function registerServices(fastify: FastifyInstance) {
    fastify.register(requestApiLoggerService);
    fastify.register(redisService);
    fastify.register(superCarService);
    fastify.register(premiumCarService);
    fastify.register(supervisorService);
}