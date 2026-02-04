/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PAGINATION MAPPER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Mappers are the bridges between worlds—domain to presentation."
 */

import type { CursorPaginatedResult } from '../../shared/utils/cursor-pagination.util.js';
import type { PaginatedResponse, PaginationMeta } from '../../application/dtos/pagination.dto.js';

/**
 * Map a cursor-paginated result to a DTO response
 */
export function mapToPaginatedResponse<TDomain, TDto>(
    result: CursorPaginatedResult<TDomain>,
    mapper: (item: TDomain) => TDto
): PaginatedResponse<TDto> {
    return {
        data: result.data.map(mapper),
        pagination: result.pagination,
    };
}

/**
 * Create pagination metadata from raw values
 */
export function createPaginationMeta(
    nextCursor: string | null,
    prevCursor: string | null,
    hasNextPage: boolean,
    hasPrevPage: boolean,
    count: number
): PaginationMeta {
    return {
        nextCursor,
        prevCursor,
        hasNextPage,
        hasPrevPage,
        count,
    };
}
