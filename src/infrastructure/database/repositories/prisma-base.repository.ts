/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRISMA BASE REPOSITORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The repository hides the persistence reality behind a domain facade."
 *
 * This abstract repository provides common CRUD operations with cursor
 * pagination for any Prisma model.
 */

import type { PrismaClient } from '@prisma/client';
import type { Entity, EntityProps } from '../../../domain/entities/base.entity.js';
import type { IRepository, QueryOptions } from '../../../domain/repositories/base.repository.js';
import { DomainError, EntityNotFoundError } from '../../../domain/errors/domain.error.js';
import { type Result, ok, err } from '../../../shared/utils/result.js';
import {
    CursorPaginator,
    type CursorPaginatedResult,
    type CursorPaginationOptions,
} from '../../../shared/utils/cursor-pagination.util.js';
import { prisma } from '../prisma/client.js';

/**
 * Abstract base repository for Prisma-backed entities
 *
 * @typeParam TEntity - The domain entity type
 * @typeParam TProps - The entity's properties type
 * @typeParam TPrismaModel - The Prisma model type (e.g., User, Post)
 */
export abstract class PrismaBaseRepository<
    TEntity extends Entity<TProps>,
    TProps extends EntityProps,
    TPrismaModel
> implements IRepository<TEntity, TProps> {
    protected readonly db: PrismaClient;
    protected readonly paginator: CursorPaginator<string, TPrismaModel>;

    constructor() {
        this.db = prisma;
        this.paginator = new CursorPaginator<string, TPrismaModel>({
            cursorKey: 'id' as keyof TPrismaModel,
            serialize: (v) => v,
            deserialize: (v) => v,
        });
    }

    /**
     * Get the Prisma model delegate (e.g., prisma.user, prisma.post)
     * Must be implemented by subclasses
     */
    protected abstract getModel(): TPrismaDelegate;

    /**
     * Convert a Prisma record to a domain entity
     * Must be implemented by subclasses
     */
    protected abstract toDomain(record: TPrismaModel): TEntity;

    /**
     * Convert a domain entity to Prisma create/update data
     * Must be implemented by subclasses
     */
    protected abstract toPersistence(entity: TEntity): TPrismaModel;

    /**
     * The entity type name for error messages
     */
    protected abstract readonly entityName: string;

    async findById(id: string): Promise<Result<TEntity, DomainError>> {
        const record = await (this.getModel() as TPrismaDelegate).findUnique({
            where: { id },
        });

        if (!record) {
            return err(new EntityNotFoundError(this.entityName, id));
        }

        return ok(this.toDomain(record as TPrismaModel));
    }

    async findMany(options?: QueryOptions<TProps>): Promise<TEntity[]> {
        const records = await (this.getModel() as TPrismaDelegate).findMany({
            where: this.buildWhereClause(options),
            orderBy: options?.orderBy
                ? { [options.orderBy.field]: options.orderBy.direction }
                : { createdAt: 'desc' },
        });

        return (records as TPrismaModel[]).map((r: TPrismaModel) => this.toDomain(r));
    }

    async findManyPaginated(
        paginationOptions: CursorPaginationOptions,
        queryOptions?: QueryOptions<TProps>
    ): Promise<CursorPaginatedResult<TEntity>> {
        const { limit, cursor } = paginationOptions;
        const decoded = cursor ? this.paginator.decode(cursor) : null;

        // Build the query
        const where = this.buildWhereClause(queryOptions);
        const cursorWhere = decoded
            ? {
                id: decoded.direction === 'forward'
                    ? { gt: decoded.value }
                    : { lt: decoded.value },
            }
            : {};

        // Fetch limit + 1 to detect if there are more items
        const records = await (this.getModel() as TPrismaDelegate).findMany({
            where: { ...where, ...cursorWhere },
            orderBy: decoded?.direction === 'backward'
                ? { id: 'desc' }
                : { id: 'asc' },
            take: limit + 1,
        });

        // Convert to domain entities
        const entities = (records as TPrismaModel[]).map((r: TPrismaModel) => this.toDomain(r));

        // Build paginated result (the paginator handles hasMore detection)
        return this.paginator.buildResult(
            entities as unknown as TPrismaModel[],
            paginationOptions
        ) as unknown as CursorPaginatedResult<TEntity>;
    }

    async exists(id: string): Promise<boolean> {
        const count = await (this.getModel() as TPrismaDelegate).count({
            where: { id },
        });
        return count > 0;
    }

    async create(entity: TEntity): Promise<Result<TEntity, DomainError>> {
        const data = this.toPersistence(entity);
        const record = await (this.getModel() as TPrismaDelegate).create({
            data,
        });
        return ok(this.toDomain(record as TPrismaModel));
    }

    async update(entity: TEntity): Promise<Result<TEntity, DomainError>> {
        const exists = await this.exists(entity.id);
        if (!exists) {
            return err(new EntityNotFoundError(this.entityName, entity.id));
        }

        const data = this.toPersistence(entity);
        const record = await (this.getModel() as TPrismaDelegate).update({
            where: { id: entity.id },
            data,
        });
        return ok(this.toDomain(record as TPrismaModel));
    }

    async delete(id: string): Promise<Result<void, DomainError>> {
        const exists = await this.exists(id);
        if (!exists) {
            return err(new EntityNotFoundError(this.entityName, id));
        }

        await (this.getModel() as TPrismaDelegate).delete({
            where: { id },
        });
        return ok(undefined);
    }

    async softDelete(id: string): Promise<Result<void, DomainError>> {
        const exists = await this.exists(id);
        if (!exists) {
            return err(new EntityNotFoundError(this.entityName, id));
        }

        await (this.getModel() as TPrismaDelegate).update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return ok(undefined);
    }

    async count(options?: QueryOptions<TProps>): Promise<number> {
        return (this.getModel() as TPrismaDelegate).count({
            where: this.buildWhereClause(options),
        });
    }

    /**
     * Build the where clause from query options
     */
    protected buildWhereClause(
        options?: QueryOptions<TProps>
    ): Record<string, unknown> {
        const where: Record<string, unknown> = {};

        if (options?.where) {
            Object.assign(where, options.where);
        }

        // Exclude soft-deleted records by default
        if (!options?.includeSoftDeleted) {
            where['deletedAt'] = null;
        }

        return where;
    }
}

/**
 * Type helper for Prisma model delegates
 */
type TPrismaDelegate = {
    findUnique: (args: { where: { id: string } }) => Promise<unknown>;
    findMany: (args: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, string>;
        take?: number;
    }) => Promise<unknown[]>;
    create: (args: { data: unknown }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
};
