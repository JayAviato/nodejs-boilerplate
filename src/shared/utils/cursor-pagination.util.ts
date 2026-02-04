/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BI-DIRECTIONAL CURSOR PAGINATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Offset pagination is a lie we tell ourselves. Cursors are the truth."
 *
 * This utility provides a generic, type-safe implementation of cursor-based
 * pagination that works with any entity and any cursor strategy.
 */

import { z } from 'zod';

/**
 * Cursor direction for bidirectional navigation
 */
export type CursorDirection = 'forward' | 'backward';

/**
 * Decoded cursor containing pagination state
 */
export interface DecodedCursor<T> {
    /** The cursor value (typically a unique identifier or timestamp) */
    value: T;
    /** Direction of pagination */
    direction: CursorDirection;
}

/**
 * Paginated response with bidirectional cursors
 */
export interface CursorPaginatedResult<T> {
    /** The data items for this page */
    data: T[];
    /** Pagination metadata */
    pagination: {
        /** Cursor for the next page (null if no more items forward) */
        nextCursor: string | null;
        /** Cursor for the previous page (null if no more items backward) */
        prevCursor: string | null;
        /** Whether there are more items in the forward direction */
        hasNextPage: boolean;
        /** Whether there are more items in the backward direction */
        hasPrevPage: boolean;
        /** Number of items in current page */
        count: number;
    };
}

/**
 * Options for cursor pagination query
 */
export interface CursorPaginationOptions {
    /** Maximum number of items to return */
    limit: number;
    /** Encoded cursor string (optional) */
    cursor?: string;
    /** Direction when no cursor is provided */
    defaultDirection?: CursorDirection;
}

/**
 * Zod schema for pagination query parameters
 */
export const cursorPaginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

/**
 * Cursor Pagination Utility Class
 *
 * Provides type-safe encoding/decoding and result building for cursor pagination.
 *
 * @typeParam TCursor - The type of the cursor value (e.g., string for UUIDs, Date for timestamps)
 * @typeParam TEntity - The type of the entity being paginated
 */
export class CursorPaginator<TCursor, TEntity> {
    private readonly cursorKey: keyof TEntity;
    private readonly serializeCursor: (value: TCursor) => string;
    private readonly deserializeCursor: (value: string) => TCursor;

    constructor(options: {
        /** The property of the entity to use as the cursor (e.g., 'id', 'createdAt') */
        cursorKey: keyof TEntity;
        /** Function to serialize the cursor value to a string */
        serialize?: (value: TCursor) => string;
        /** Function to deserialize a string back to the cursor value */
        deserialize?: (value: string) => TCursor;
    }) {
        this.cursorKey = options.cursorKey;
        this.serializeCursor = options.serialize ?? String;
        this.deserializeCursor =
            options.deserialize ?? ((v: string) => v as unknown as TCursor);
    }

    /**
     * Encode a cursor value and direction into a Base64 string
     */
    encode(value: TCursor, direction: CursorDirection): string {
        const payload = JSON.stringify({
            v: this.serializeCursor(value),
            d: direction,
        });
        return Buffer.from(payload).toString('base64url');
    }

    /**
     * Decode a Base64 cursor string into its value and direction
     */
    decode(cursor: string): DecodedCursor<TCursor> | null {
        try {
            const payload = Buffer.from(cursor, 'base64url').toString('utf-8');
            const parsed = JSON.parse(payload) as { v: string; d: CursorDirection };

            return {
                value: this.deserializeCursor(parsed.v),
                direction: parsed.d,
            };
        } catch {
            return null;
        }
    }

    /**
     * Build a paginated result from a list of entities
     *
     * @param entities - The entities fetched from the database (should include 1 extra to detect hasMore)
     * @param options - The pagination options used for the query
     * @returns A properly formatted paginated result with bidirectional cursors
     */
    buildResult(
        entities: TEntity[],
        options: CursorPaginationOptions
    ): CursorPaginatedResult<TEntity> {
        const { limit, cursor } = options;
        const direction: CursorDirection =
            (cursor ? this.decode(cursor)?.direction : null) ??
            options.defaultDirection ??
            'forward';

        // We fetch limit + 1 to detect if there are more items
        const hasMore = entities.length > limit;
        const items = hasMore ? entities.slice(0, limit) : entities;

        // For backward pagination, we need to reverse the results
        // (DB returns newest first, but we want oldest first in the response)
        const data = direction === 'backward' ? items.reverse() : items;

        // Determine cursors based on direction and results
        const firstItem = data[0];
        const lastItem = data[data.length - 1];

        let nextCursor: string | null = null;
        let prevCursor: string | null = null;
        let hasNextPage = false;
        let hasPrevPage = false;

        if (data.length > 0) {
            if (direction === 'forward') {
                // Moving forward: next goes forward, prev goes backward
                hasNextPage = hasMore;
                hasPrevPage = cursor !== undefined; // Has prev if we came from somewhere

                if (hasNextPage && lastItem) {
                    nextCursor = this.encode(
                        lastItem[this.cursorKey] as TCursor,
                        'forward'
                    );
                }
                if (hasPrevPage && firstItem) {
                    prevCursor = this.encode(
                        firstItem[this.cursorKey] as TCursor,
                        'backward'
                    );
                }
            } else {
                // Moving backward: next goes forward, prev goes backward
                hasNextPage = cursor !== undefined; // Has next if we came from somewhere
                hasPrevPage = hasMore;

                if (hasNextPage && lastItem) {
                    nextCursor = this.encode(
                        lastItem[this.cursorKey] as TCursor,
                        'forward'
                    );
                }
                if (hasPrevPage && firstItem) {
                    prevCursor = this.encode(
                        firstItem[this.cursorKey] as TCursor,
                        'backward'
                    );
                }
            }
        }

        return {
            data,
            pagination: {
                nextCursor,
                prevCursor,
                hasNextPage,
                hasPrevPage,
                count: data.length,
            },
        };
    }

    /**
     * Get the cursor key for use in database queries
     */
    getCursorKey(): keyof TEntity {
        return this.cursorKey;
    }
}

/**
 * Factory function to create a string-ID based paginator (most common case)
 */
export function createIdPaginator<TEntity extends { id: string }>(): CursorPaginator<
    string,
    TEntity
> {
    return new CursorPaginator<string, TEntity>({
        cursorKey: 'id',
        serialize: (v) => v,
        deserialize: (v) => v,
    });
}

/**
 * Factory function to create a date-based paginator
 */
export function createDatePaginator<TEntity>(
    cursorKey: keyof TEntity
): CursorPaginator<Date, TEntity> {
    return new CursorPaginator<Date, TEntity>({
        cursorKey,
        serialize: (v) => v.toISOString(),
        deserialize: (v) => new Date(v),
    });
}
