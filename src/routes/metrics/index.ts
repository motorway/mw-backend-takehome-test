import { FastifyInstance } from 'fastify';
import {
    Counter,
    register,
} from 'prom-client';

export let superCarRequestCnt: Counter;
export let superCarRequestErrorCnt: Counter;

export function metricsRoutes(fastify: FastifyInstance) {

    fastify.get("/metrics", async (request, reply) => {
        reply.header("Content-Type", register.contentType);
        return register.metrics();
    });
}