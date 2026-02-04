/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The client sees only what they need. The developer sees everything.
 * This is the firewall between chaos and comprehension."
 *
 * This middleware catches all errors, sanitizes them for clients,
 * and logs full details for developers.
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError, DomainErrorCode } from '../../../domain/errors/domain.error.js';
import {
    ApplicationError,
    ApplicationErrorCode,
    ERROR_STATUS_MAP,
} from '../../../application/errors/application.error.js';
import { createLogger } from '../../../infrastructure/logging/pino.logger.js';
import { isProduction } from '../../../infrastructure/config/env.config.js';

const logger = createLogger('error-handler');

/**
 * Client-safe error response
 */
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    };
    requestId?: string | undefined;
    timestamp: string;
}

/**
 * Format Zod validation errors for client response
 */
function formatZodError(error: ZodError): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.');
        const field = path || 'root';

        if (!fieldErrors[field]) {
            fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
    }

    return fieldErrors;
}

/**
 * Get HTTP status code for an error
 */
function getStatusCode(error: Error): number {
    if (error instanceof ApplicationError) {
        return error.statusCode;
    }

    if (error instanceof DomainError) {
        return ERROR_STATUS_MAP[error.code] ?? 422;
    }

    if (error instanceof ZodError) {
        return 400;
    }

    return 500;
}

/**
 * Get error code for response
 */
function getErrorCode(error: Error): string {
    if (error instanceof ApplicationError) {
        return error.code;
    }

    if (error instanceof DomainError) {
        return error.code;
    }

    if (error instanceof ZodError) {
        return ApplicationErrorCode.VALIDATION_ERROR;
    }

    return ApplicationErrorCode.INTERNAL_ERROR;
}

/**
 * Get client-safe message
 */
function getClientMessage(error: Error): string {
    // Domain and application errors are safe to expose
    if (error instanceof DomainError || error instanceof ApplicationError) {
        return error.message;
    }

    if (error instanceof ZodError) {
        return 'Validation failed';
    }

    // Generic errors get a safe message in production
    if (isProduction()) {
        return 'An unexpected error occurred';
    }

    // In development, show the actual error
    return error.message;
}

/**
 * Get additional details for the client (if any)
 */
function getClientDetails(error: Error): Record<string, unknown> | undefined {
    if (error instanceof ZodError) {
        return { fieldErrors: formatZodError(error) };
    }

    if (error instanceof ApplicationError && error.details) {
        return error.details;
    }

    if (error instanceof DomainError) {
        // Only include non-sensitive metadata
        const { entityType, field } = error.metadata;
        if (entityType || field) {
            return { entityType, field };
        }
    }

    return undefined;
}

/**
 * Global error handler middleware
 *
 * This MUST be the last middleware in the chain.
 * It catches all errors and sends a sanitized response.
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const requestId = req.headers['x-request-id'] as string | undefined;
    const statusCode = getStatusCode(error);

    // Log the full error for developers
    if (statusCode >= 500) {
        logger.error('Unhandled error', error, {
            requestId,
            method: req.method,
            path: req.path,
            statusCode,
            userId: (req as RequestWithUser).userId,
        });
    } else {
        logger.warn('Client error', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode,
            errorCode: getErrorCode(error),
            message: error.message,
        });
    }

    // Build sanitized response
    const response: ErrorResponse = {
        success: false,
        error: {
            code: getErrorCode(error),
            message: getClientMessage(error),
            details: getClientDetails(error),
        },
        requestId,
        timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
};

/**
 * Not found handler (for undefined routes)
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    const error = new DomainError(
        DomainErrorCode.ENTITY_NOT_FOUND,
        `Route ${req.method} ${req.path} not found`
    );
    next(error);
}

/**
 * Request with user info (extended by auth middleware)
 */
interface RequestWithUser extends Request {
    userId?: string | undefined;
}
