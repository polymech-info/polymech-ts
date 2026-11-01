import { ProductErrorCode } from './enums.js';

export interface ProductErrorPayload {
    message: string;
    [key: string]: any;
}

export class ProductError extends Error {
    public readonly code: ProductErrorCode;
    public readonly payload: ProductErrorPayload;

    constructor(code: ProductErrorCode, payload: ProductErrorPayload | string) {
        const message = typeof payload === 'string' ? payload : payload.message;
        super(message);
        this.code = code;
        this.payload = typeof payload === 'string' ? { message: payload } : payload;

        // Restore prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            payload: this.payload
        };
    }
}
