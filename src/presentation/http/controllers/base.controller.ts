/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASE CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Controllers are translators—they speak HTTP to the outside world
 * and domain to the inside. They own neither language."
 */

import type { Response } from 'express';
import { isErr, type Result } from '../../../shared/utils/result.js';
import type { PaginatedResponse } from '../../../application/dtos/pagination.dto.js';

/**
 * Standard success response
 */
export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: Record<string, unknown> | undefined;
}

/**
 * Standard paginated response
 */
export interface PaginatedSuccessResponse<T> extends SuccessResponse<T[]> {
    pagination: {
        nextCursor: string | null;
        prevCursor: string | null;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        count: number;
    };
}

/**
 * Base controller with common response helpers
 */
export abstract class BaseController {
    /**
     * Send a successful response
     */
    protected ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
        const response: SuccessResponse<T> = {
            success: true,
            data,
            meta,
        };
        res.status(200).json(response);
    }

    /**
     * Send a created response (201)
     */
    protected created<T>(res: Response, data: T): void {
        const response: SuccessResponse<T> = {
            success: true,
            data,
        };
        res.status(201).json(response);
    }

    /**
     * Send a no content response (204)
     */
    protected noContent(res: Response): void {
        res.status(204).send();
    }

    /**
     * Send a paginated response
     */
    protected paginated<T>(res: Response, result: PaginatedResponse<T>): void {
        const response: PaginatedSuccessResponse<T> = {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
        res.status(200).json(response);
    }

    /**
     * Handle a Result from a use case
     * If Ok, sends success response. If Err, throws for error middleware.
     */
    protected handleResult<T, E extends Error>(
        res: Response,
        result: Result<T, E>,
        statusCode: number = 200
    ): void {
        if (isErr(result)) {
            throw result.error;
        }

        const response: SuccessResponse<T> = {
            success: true,
            data: result.value,
        };
        res.status(statusCode).json(response);
    }

    /**
     * Handle a Result and call a custom success handler
     */
    protected handleResultWith<T, E extends Error>(
        result: Result<T, E>,
        onSuccess: (value: T) => void
    ): void {
        if (isErr(result)) {
            throw result.error;
        }
        onSuccess(result.value);
    }
}
