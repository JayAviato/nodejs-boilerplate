/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASE REPOSITORY INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "A repository is a seam—a place where the domain meets the world.
 * It speaks the language of the domain but hides the persistence reality."
 *
 * Repositories are the ports through which the domain accesses persistence.
 * They deal only in domain objects, never in database primitives.
 */

import type { Entity, EntityProps } from '../entities/base.entity.js';
import type {
    CursorPaginatedResult,
    CursorPaginationOptions,
} from '../../shared/utils/cursor-pagination.util.js';
import type { Result } from '../../shared/utils/result.js';
import type { DomainError } from '../errors/domain.error.js';

/**
 * Query options for filtering and sorting
 */
export interface QueryOptions<TEntity> {
    /** Filter criteria */
    where?: Partial<TEntity>;
    /** Fields to order by */
    orderBy?: {
        field: keyof TEntity;
        direction: 'asc' | 'desc';
    };
    /** Include soft-deleted records */
    includeSoftDeleted?: boolean;
}

/**
 * Base repository interface with CRUD operations
 *
 * This is a port (interface) that infrastructure adapters will implement.
 * The domain depends on this abstraction, never on concrete implementations.
 *
 * @typeParam TEntity - The domain entity type
 * @typeParam TProps - The entity's properties type
 */
export interface IRepository<TEntity extends Entity<TProps>, TProps extends EntityProps> {
    /**
     * Find an entity by its unique identifier
     * @returns Result with the entity or an error if not found
     */
    findById(id: string): Promise<Result<TEntity, DomainError>>;

    /**
     * Find entities matching the given criteria
     */
    findMany(options?: QueryOptions<TProps>): Promise<TEntity[]>;

    /**
     * Find entities with cursor pagination
     */
    findManyPaginated(
        paginationOptions: CursorPaginationOptions,
        queryOptions?: QueryOptions<TProps>
    ): Promise<CursorPaginatedResult<TEntity>>;

    /**
     * Check if an entity with the given ID exists
     */
    exists(id: string): Promise<boolean>;

    /**
     * Persist a new entity
     * @returns Result with the created entity or an error
     */
    create(entity: TEntity): Promise<Result<TEntity, DomainError>>;

    /**
     * Update an existing entity
     * @returns Result with the updated entity or an error
     */
    update(entity: TEntity): Promise<Result<TEntity, DomainError>>;

    /**
     * Delete an entity by ID
     * @returns Result indicating success or failure
     */
    delete(id: string): Promise<Result<void, DomainError>>;

    /**
     * Soft delete an entity by ID (if supported)
     */
    softDelete?(id: string): Promise<Result<void, DomainError>>;

    /**
     * Count entities matching the given criteria
     */
    count(options?: QueryOptions<TProps>): Promise<number>;
}

/**
 * Read-only repository for query-only use cases
 */
export interface IReadOnlyRepository<TEntity extends Entity<TProps>, TProps extends EntityProps> {
    findById(id: string): Promise<Result<TEntity, DomainError>>;
    findMany(options?: QueryOptions<TProps>): Promise<TEntity[]>;
    findManyPaginated(
        paginationOptions: CursorPaginationOptions,
        queryOptions?: QueryOptions<TProps>
    ): Promise<CursorPaginatedResult<TEntity>>;
    exists(id: string): Promise<boolean>;
    count(options?: QueryOptions<TProps>): Promise<number>;
}

/**
 * Repository with transaction support
 */
export interface ITransactionalRepository<
    TEntity extends Entity<TProps>,
    TProps extends EntityProps
> extends IRepository<TEntity, TProps> {
    /**
     * Execute operations within a transaction
     */
    transaction<T>(
        operation: (repo: IRepository<TEntity, TProps>) => Promise<T>
    ): Promise<T>;
}
