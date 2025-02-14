import { Counter } from 'prom-client';

export const supercar_requests_total = 'supercar_requests_total' as const;
export const supercar_requests_errors_total = 'supercar_requests_errors_total' as const;

let registerSuperCarRequestCntState: Counter;
let registerSuperCarRequestErrorCntState: Counter;

export function registerSuperCarRequestCnt() {
    try {
        registerSuperCarRequestCntState = new Counter({
            name: supercar_requests_total,
            help: "Total number of HTTP requests to Supercar",
        });
    } catch (err) {
        // -----
    }
    return registerSuperCarRequestCntState!;
}

export function registerSuperCarRequestErrorCnt() {
    try {
        registerSuperCarRequestErrorCntState = new Counter({
            name: supercar_requests_errors_total,
            help: "Total number of failed HTTP requests to Supercar",
        });
    } catch (err) {
        // -------
    }
    return registerSuperCarRequestErrorCntState!;
}
