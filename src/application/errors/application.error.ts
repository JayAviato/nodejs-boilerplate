/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APPLICATION ERRORS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Application errors are the boundary guards. They translate domain
 * violations into actionable responses for the outside world."
 */

import { DomainErrorCode } from '../../domain/errors/domain.error.js';

/**
 * Application-level error codes
 */
export enum ApplicationErrorCode {
    // Authentication & Authorization
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INVALID_TOKEN = 'INVALID_TOKEN',

    // Input validation
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',

    // External services
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    TIMEOUT = 'TIMEOUT',

    // Rate limiting
    RATE_LIMITED = 'RATE_LIMITED',

    // General
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * HTTP status codes for error mapping
 */
export const ERROR_STATUS_MAP: Record<ApplicationErrorCode | DomainErrorCode, number> = {
    // Application errors
    [ApplicationErrorCode.UNAUTHORIZED]: 401,
    [ApplicationErrorCode.FORBIDDEN]: 403,
    [ApplicationErrorCode.TOKEN_EXPIRED]: 401,
    [ApplicationErrorCode.INVALID_TOKEN]: 401,
    [ApplicationErrorCode.VALIDATION_ERROR]: 400,
    [ApplicationErrorCode.INVALID_INPUT]: 400,
    [ApplicationErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ApplicationErrorCode.TIMEOUT]: 504,
    [ApplicationErrorCode.RATE_LIMITED]: 429,
    [ApplicationErrorCode.INTERNAL_ERROR]: 500,
    [ApplicationErrorCode.NOT_IMPLEMENTED]: 501,

    // Domain errors
    [DomainErrorCode.ENTITY_NOT_FOUND]: 404,
    [DomainErrorCode.ENTITY_ALREADY_EXISTS]: 409,
    [DomainErrorCode.ENTITY_VALIDATION_FAILED]: 400,
    [DomainErrorCode.INVARIANT_VIOLATION]: 422,
    [DomainErrorCode.PRECONDITION_FAILED]: 412,
    [DomainErrorCode.OPERATION_NOT_ALLOWED]: 403,
    [DomainErrorCode.INVALID_VALUE]: 400,
    [DomainErrorCode.VALUE_OUT_OF_RANGE]: 400,
};

/**
 * Base class for application errors
 */
export class ApplicationError extends Error {
    public readonly code: ApplicationErrorCode;
    public readonly statusCode: number;
    public readonly details: Record<string, unknown> | undefined;
    public readonly timestamp: Date;

    constructor(
        code: ApplicationErrorCode,
        message: string,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApplicationError';
        this.code = code;
        this.statusCode = ERROR_STATUS_MAP[code];
        this.details = details;
        this.timestamp = new Date();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
        };
    }
}

/**
 * Validation error with field-level details
 */
export class ValidationError extends ApplicationError {
    public readonly fieldErrors: Record<string, string[]>;

    constructor(fieldErrors: Record<string, string[]>) {
        const message = 'Validation failed';
        super(ApplicationErrorCode.VALIDATION_ERROR, message, { fieldErrors });
        this.name = 'ValidationError';
        this.fieldErrors = fieldErrors;
    }
}

/**
 * Authentication error
 */
export class UnauthorizedError extends ApplicationError {
    constructor(message = 'Authentication required') {
        super(ApplicationErrorCode.UNAUTHORIZED, message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Authorization error
 */
export class ForbiddenError extends ApplicationError {
    constructor(message = 'Permission denied') {
        super(ApplicationErrorCode.FORBIDDEN, message);
        this.name = 'ForbiddenError';
    }
}

/**
 * External service error
 */
export class ExternalServiceError extends ApplicationError {
    constructor(
        serviceName: string,
        originalError?: Error
    ) {
        super(
            ApplicationErrorCode.EXTERNAL_SERVICE_ERROR,
            `External service '${serviceName}' failed`,
            { serviceName, originalError: originalError?.message }
        );
        this.name = 'ExternalServiceError';
    }
}
