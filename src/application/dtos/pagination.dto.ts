/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PAGINATION DTOs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "DTOs are the contracts at the boundary. Zod ensures the contract is kept."
 *
 * These schemas define and validate pagination input/output.
 * Types are inferred—zero duplication between validation and types.
 */

import { z } from 'zod';

/**
 * Pagination request schema
 * Used for validating incoming pagination parameters
 */
export const paginationRequestSchema = z.object({
    /** Maximum number of items to return (default: 20, max: 100) */
    limit: z.coerce
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(20),

    /** Cursor for pagination (optional) */
    cursor: z
        .string()
        .optional()
        .describe('Base64-encoded cursor for pagination'),
});

/**
 * Inferred type from the schema
 */
export type PaginationRequest = z.infer<typeof paginationRequestSchema>;

/**
 * Pagination metadata schema
 */
export const paginationMetaSchema = z.object({
    nextCursor: z.string().nullable(),
    prevCursor: z.string().nullable(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
    count: z.number().int().min(0),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * Factory to create paginated response schema for any data type
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
    dataSchema: T
) {
    return z.object({
        data: z.array(dataSchema),
        pagination: paginationMetaSchema,
    });
}

/**
 * Generic paginated response type
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

/**
 * Create a paginated response object
 */
export function createPaginatedResponse<T>(
    data: T[],
    pagination: PaginationMeta
): PaginatedResponse<T> {
    return { data, pagination };
}
