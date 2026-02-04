/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CURSOR PAGINATION UNIT TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    CursorPaginator,
    createIdPaginator,
    createDatePaginator,
    cursorPaginationSchema,
    type CursorPaginationOptions,
} from '../../src/shared/utils/cursor-pagination.util';

interface TestEntity {
    id: string;
    name: string;
    createdAt: Date;
}

describe('CursorPaginator', () => {
    let paginator: CursorPaginator<string, TestEntity>;

    beforeEach(() => {
        paginator = new CursorPaginator<string, TestEntity>({
            cursorKey: 'id',
            serialize: (v) => v,
            deserialize: (v) => v,
        });
    });

    describe('encode/decode', () => {
        it('should encode and decode a forward cursor', () => {
            const encoded = paginator.encode('test-id-123', 'forward');
            const decoded = paginator.decode(encoded);

            expect(decoded).toEqual({
                value: 'test-id-123',
                direction: 'forward',
            });
        });

        it('should encode and decode a backward cursor', () => {
            const encoded = paginator.encode('test-id-456', 'backward');
            const decoded = paginator.decode(encoded);

            expect(decoded).toEqual({
                value: 'test-id-456',
                direction: 'backward',
            });
        });

        it('should return null for invalid cursor', () => {
            expect(paginator.decode('invalid-base64')).toBeNull();
            expect(paginator.decode('')).toBeNull();
        });

        it('should handle special characters in cursor value', () => {
            const encoded = paginator.encode('id/with+special=chars', 'forward');
            const decoded = paginator.decode(encoded);

            expect(decoded?.value).toBe('id/with+special=chars');
        });
    });

    describe('buildResult', () => {
        const createEntities = (count: number): TestEntity[] =>
            Array.from({ length: count }, (_, i) => ({
                id: `id-${i + 1}`,
                name: `Entity ${i + 1}`,
                createdAt: new Date(),
            }));

        it('should build result for first page with more items', () => {
            const entities = createEntities(21); // limit + 1
            const options: CursorPaginationOptions = { limit: 20 };

            const result = paginator.buildResult(entities, options);

            expect(result.data).toHaveLength(20);
            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.hasPrevPage).toBe(false);
            expect(result.pagination.nextCursor).toBeTruthy();
            expect(result.pagination.prevCursor).toBeNull();
            expect(result.pagination.count).toBe(20);
        });

        it('should build result for last page', () => {
            const entities = createEntities(15); // less than limit
            const options: CursorPaginationOptions = { limit: 20 };

            const result = paginator.buildResult(entities, options);

            expect(result.data).toHaveLength(15);
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.hasPrevPage).toBe(false);
            expect(result.pagination.nextCursor).toBeNull();
            expect(result.pagination.count).toBe(15);
        });

        it('should build result for middle page going forward', () => {
            const entities = createEntities(21);
            const cursor = paginator.encode('some-previous-id', 'forward');
            const options: CursorPaginationOptions = { limit: 20, cursor };

            const result = paginator.buildResult(entities, options);

            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.hasPrevPage).toBe(true);
            expect(result.pagination.nextCursor).toBeTruthy();
            expect(result.pagination.prevCursor).toBeTruthy();
        });

        it('should handle empty result set', () => {
            const entities: TestEntity[] = [];
            const options: CursorPaginationOptions = { limit: 20 };

            const result = paginator.buildResult(entities, options);

            expect(result.data).toHaveLength(0);
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.hasPrevPage).toBe(false);
            expect(result.pagination.nextCursor).toBeNull();
            expect(result.pagination.prevCursor).toBeNull();
            expect(result.pagination.count).toBe(0);
        });
    });

    describe('getCursorKey', () => {
        it('should return the cursor key', () => {
            expect(paginator.getCursorKey()).toBe('id');
        });
    });
});

describe('createIdPaginator', () => {
    it('should create a paginator using id as cursor key', () => {
        interface EntityWithId {
            id: string;
            value: number;
        }

        const paginator = createIdPaginator<EntityWithId>();
        expect(paginator.getCursorKey()).toBe('id');

        const encoded = paginator.encode('uuid-123', 'forward');
        const decoded = paginator.decode(encoded);
        expect(decoded?.value).toBe('uuid-123');
    });
});

describe('createDatePaginator', () => {
    it('should create a paginator with date serialization', () => {
        interface EntityWithDate {
            id: string;
            createdAt: Date;
        }

        const paginator = createDatePaginator<EntityWithDate>('createdAt');
        expect(paginator.getCursorKey()).toBe('createdAt');

        const date = new Date('2024-01-15T10:30:00.000Z');
        const encoded = paginator.encode(date, 'forward');
        const decoded = paginator.decode(encoded);

        expect(decoded?.value).toEqual(date);
    });
});

describe('cursorPaginationSchema', () => {
    it('should validate and parse valid input', () => {
        const result = cursorPaginationSchema.parse({
            limit: '25',
            cursor: 'some-base64-cursor',
        });

        expect(result.limit).toBe(25);
        expect(result.cursor).toBe('some-base64-cursor');
    });

    it('should apply defaults', () => {
        const result = cursorPaginationSchema.parse({});

        expect(result.limit).toBe(20);
        expect(result.cursor).toBeUndefined();
    });

    it('should reject invalid limit', () => {
        expect(() =>
            cursorPaginationSchema.parse({ limit: 0 })
        ).toThrow();

        expect(() =>
            cursorPaginationSchema.parse({ limit: 101 })
        ).toThrow();
    });

    it('should coerce string limit to number', () => {
        const result = cursorPaginationSchema.parse({ limit: '50' });
        expect(result.limit).toBe(50);
    });
});
