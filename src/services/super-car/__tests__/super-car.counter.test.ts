import { Counter } from 'prom-client';
import {
    beforeEach,
    describe,
    expect,
    it,
    Mock,
    vi,
} from 'vitest';

import {
    registerSuperCarRequestCnt,
    registerSuperCarRequestErrorCnt,
    supercar_requests_errors_total,
    supercar_requests_total,
} from '../super-car.counter';

// Mock the Counter constructor
vi.mock('prom-client', () => {
    return {
        Counter: vi.fn().mockImplementation(({ name, help }) => ({
            name,
            help,
            inc: vi.fn(), // Mocking increment function
        }))
    };
});

describe('Supercar Prometheus Counters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should register the total request counter correctly', () => {
        registerSuperCarRequestCnt();

        expect(Counter).toHaveBeenCalledWith({
            name: supercar_requests_total,
            help: "Total number of HTTP requests to Supercar",
        });

    });

    it('should register the error request counter correctly', () => {
        registerSuperCarRequestErrorCnt();

        expect(Counter).toHaveBeenCalledWith({
            name: supercar_requests_errors_total,
            help: "Total number of failed HTTP requests to Supercar",
        });
    });

    it('should handle errors gracefully when creating a counter', () => {
        (Counter as unknown as Mock).mockImplementation(() => {
            throw new Error('Prometheus Counter error');
        });

        expect(() => registerSuperCarRequestCnt()).not.toThrow();
        expect(() => registerSuperCarRequestErrorCnt()).not.toThrow();
    });
});
