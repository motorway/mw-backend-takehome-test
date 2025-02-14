export class GenericHTTPError extends Error {
    public statusCode: number;
    public code: string;

    constructor(message: string, statusCode: number, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || 'HTTP_ERROR';
        this.name = 'HttpError';  // Set the name of the error class
    }
}

export class Generic503Error extends GenericHTTPError {
    constructor(message: string, code: string = 'HTTP_ERROR') {
        super(message, 503, code);
    }
}
