import { beforeAll, afterAll } from 'vitest';
import { app } from '@app/app';

export const fastify = app();

beforeAll(async () => {
  await fastify.ready();
});

afterAll(async () => {
  await fastify.close();
});
