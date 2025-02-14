import './env';
import 'reflect-metadata';

import {
  fastify as Fastify,
  FastifyServerOptions,
} from 'fastify';
import databaseConnection from 'typeorm-fastify-plugin';

import { ProviderLogs } from './models/provider-logs';
import { VehicleValuation } from './models/vehicle-valuation';
import { metricsRoutes } from './routes/metrics';
import { valuationRoutes } from './routes/valuation';
import { registerServices } from './services';

export const app = (opts?: FastifyServerOptions) => {
  const fastify = Fastify(opts);

  fastify
    .register(databaseConnection, {
      type: 'sqlite',
      database: process.env.DATABASE_PATH!,
      synchronize: process.env.SYNC_DATABASE === 'true',
      logging: false,
      entities: [VehicleValuation, ProviderLogs],
      migrations: [],
      subscribers: [],
    })
    .ready();

  fastify.get('/', async () => {
    return { hello: 'world' };
  });


  registerServices(fastify);

  metricsRoutes(fastify);
  valuationRoutes(fastify);

  return fastify;
};
