import 'fastify';

import {
    PremiumCarService,
} from '@app/services/premium-car/premium-car.service';
import { RedisService } from '@app/services/redis/redis.service';
import {
    RequestApiLoggerService,
} from '@app/services/request-api-logger/request-api-logger.service';
import { SuperCarService } from '@app/services/super-car/super-car.service';
import { SupervisorService } from '@app/services/supervisor/supervisor.service';

type ServiceRegistry = {
    superCarService: SuperCarService;
    premiumCarService: PremiumCarService;
    supervisorService: SupervisorService;
    redisService: RedisService;
    requestApiLoggerService: RequestApiLoggerService;
};

declare module 'fastify' {
    interface FastifyInstance extends ServiceRegistry { }
}
