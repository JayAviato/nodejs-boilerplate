/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST ENTITY FACTORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Factories produce consistent test data on demand. They are the
 * manufacturing plants of the testing world."
 *
 * This factory pattern allows creating test entities with sensible defaults
 * while allowing overrides for specific test cases.
 */

import { randomUUID } from 'crypto';

/**
 * Factory builder function type
 */
type FactoryBuilder<T> = (overrides?: Partial<T>) => T;

/**
 * Factory with sequence tracking for unique values
 */
interface Factory<T> {
    build: FactoryBuilder<T>;
    buildMany: (count: number, overrides?: Partial<T>) => T[];
    sequence: number;
    reset: () => void;
}

/**
 * Create a factory for a given type
 */
export function createFactory<T>(defaults: (sequence: number) => T): Factory<T> {
    let sequence = 0;

    const build: FactoryBuilder<T> = (overrides = {}) => {
        sequence++;
        const entity = defaults(sequence);
        return { ...entity, ...overrides };
    };

    const buildMany = (count: number, overrides: Partial<T> = {}): T[] => {
        return Array.from({ length: count }, () => build(overrides));
    };

    const reset = () => {
        sequence = 0;
    };

    return {
        build,
        buildMany,
        get sequence() {
            return sequence;
        },
        reset,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE FACTORIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * User entity type (matches Prisma model)
 */
export interface UserData {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

/**
 * User factory
 */
export const userFactory = createFactory<UserData>((sequence) => ({
    id: randomUUID(),
    email: `user${sequence}@example.com`,
    name: `Test User ${sequence}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
}));

/**
 * Post entity type (matches Prisma model)
 */
export interface PostData {
    id: string;
    title: string;
    content: string;
    published: boolean;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

/**
 * Post factory
 */
export const postFactory = createFactory<PostData>((sequence) => ({
    id: randomUUID(),
    title: `Test Post ${sequence}`,
    content: `This is the content of test post ${sequence}. It contains enough text to simulate real content.`,
    published: false,
    authorId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
}));

/**
 * Pagination test data factory
 */
export interface PaginatedTestData<T> {
    items: T[];
    totalCount: number;
}

export function createPaginatedTestData<T>(
    factory: Factory<T>,
    totalCount: number
): PaginatedTestData<T> {
    factory.reset();
    return {
        items: factory.buildMany(totalCount),
        totalCount,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAIT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply common traits to entities
 */
export const traits = {
    /**
     * Soft deleted entity
     */
    deleted: <T extends { deletedAt: Date | null }>(entity: T): T => ({
        ...entity,
        deletedAt: new Date(),
    }),

    /**
     * Entity created in the past
     */
    createdDaysAgo: <T extends { createdAt: Date }>(
        entity: T,
        days: number
    ): T => ({
        ...entity,
        createdAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    }),

    /**
     * Published post
     */
    published: (post: PostData): PostData => ({
        ...post,
        published: true,
    }),
};
