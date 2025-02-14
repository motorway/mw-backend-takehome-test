import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    Generic503Error,
    GenericHTTPError,
} from '../error';

describe('GenericHTTPError', () => {
    it('should create an instance with correct properties', () => {
        const error = new GenericHTTPError('Something went wrong', 400, 'BAD_REQUEST');

        expect(error).toBeInstanceOf(GenericHTTPError);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Something went wrong');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.name).toBe('HttpError');
    });

    it('should default code to HTTP_ERROR when not provided', () => {
        const error = new GenericHTTPError('An error occurred', 404);

        expect(error.code).toBe('HTTP_ERROR');
    });
});

describe('Generic503Error', () => {
    it('should create an instance with statusCode 503', () => {
        const error = new Generic503Error('Service Unavailable', 'SERVICE_DOWN');

        expect(error).toBeInstanceOf(Generic503Error);
        expect(error).toBeInstanceOf(GenericHTTPError);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Service Unavailable');
        expect(error.statusCode).toBe(503);
        expect(error.code).toBe('SERVICE_DOWN');
        expect(error.name).toBe('HttpError');
    });

    it('should default code to HTTP_ERROR when not provided', () => {
        const error = new Generic503Error('Service Unavailable');

        expect(error.code).toBe('HTTP_ERROR');
    });
});
