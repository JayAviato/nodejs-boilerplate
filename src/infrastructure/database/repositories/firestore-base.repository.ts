/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FIRESTORE BASE REPOSITORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The repository hides the persistence reality behind a domain facade."
 *
 * This abstract repository provides common CRUD operations with cursor
 * pagination for Firestore.
 */

import {
    type CollectionReference,
    type DocumentData,
    type Query,
} from 'firebase-admin/firestore';
import type { Entity, EntityProps } from '../../../domain/entities/base.entity.js';
import type { IRepository, QueryOptions } from '../../../domain/repositories/base.repository.js';
import { DomainError, EntityNotFoundError } from '../../../domain/errors/domain.error.js';
import { type Result, ok, err } from '../../../shared/utils/result.js';
import {
    CursorPaginator,
    type CursorPaginatedResult,
    type CursorPaginationOptions,
} from '../../../shared/utils/cursor-pagination.util.js';
import { getFirestoreClient } from '../firebase/client.js';

/**
 * Abstract base repository for Firestore-backed entities
 */
export abstract class FirestoreBaseRepository<
    TEntity extends Entity<TProps>,
    TProps extends EntityProps
> implements IRepository<TEntity, TProps> {
    protected readonly db = getFirestoreClient();
    protected readonly paginator: CursorPaginator<string, DocumentData>;

    constructor() {
        // We use the ID as the cursor value for simplicity in generic implementation
        // Advanced implementations might use timestamps
        this.paginator = new CursorPaginator<string, DocumentData>({
            cursorKey: 'id',
            serialize: (v) => v,
            deserialize: (v) => v,
        });
    }

    /**
     * Get the Firestore collection name
     */
    protected abstract readonly collectionName: string;

    /**
     * Get the Firestore collection reference
     */
    protected getCollection(): CollectionReference<DocumentData> {
        return this.db.collection(this.collectionName);
    }

    /**
     * Convert Firestore data to domain entity
     */
    protected abstract toDomain(id: string, data: DocumentData): TEntity;

    /**
     * Convert domain entity to Firestore data
     */
    protected abstract toPersistence(entity: TEntity): DocumentData;

    /**
     * The entity type name for error messages
     */
    protected abstract readonly entityName: string;

    async findById(id: string): Promise<Result<TEntity, DomainError>> {
        const doc = await this.getCollection().doc(id).get();

        if (!doc.exists) {
            return err(new EntityNotFoundError(this.entityName, id));
        }

        return ok(this.toDomain(doc.id, doc.data()!));
    }

    async findMany(options?: QueryOptions<TProps>): Promise<TEntity[]> {
        let query: Query<DocumentData> = this.getCollection();

        if (options?.orderBy) {
            query = query.orderBy(options.orderBy.field as string, options.orderBy.direction);
        } else {
            query = query.orderBy('createdAt', 'desc');
        }

        // Filter support matching
        if (options?.where) {
            for (const [key, value] of Object.entries(options.where)) {
                if (value !== undefined) {
                    query = query.where(key, '==', value);
                }
            }
        }

        const snapshot = await query.get();
        return snapshot.docs.map((doc) => this.toDomain(doc.id, doc.data()));
    }

    async findManyPaginated(
        paginationOptions: CursorPaginationOptions,
        queryOptions?: QueryOptions<TProps>
    ): Promise<CursorPaginatedResult<TEntity>> {
        const { limit, cursor } = paginationOptions;
        const decoded = cursor ? this.paginator.decode(cursor) : null;

        let query: Query<DocumentData> = this.getCollection();

        // Apply filters
        if (queryOptions?.where) {
            for (const [key, value] of Object.entries(queryOptions.where)) {
                if (value !== undefined) {
                    query = query.where(key, '==', value);
                }
            }
        }

        // Default ordering by ID is required for stable cursor pagination in this simplified implementation
        // or we need to ensure the order field is unique.
        // For mixed ordering, Firestore requires composite indexes.
        if (decoded?.direction === 'backward') {
            query = query.orderBy('id', 'desc');
        } else {
            query = query.orderBy('id', 'asc');
        }

        // Apply cursor
        if (decoded) {
            // Note: Efficient Firestore cursor pagination typically uses the actual document snapshot
            // In this generic adapter, we are using the ID which works if ordered by ID
            // For complex queries, you'd want to pass the last document values
            query = query.startAfter(decoded.value);
        }

        // Fetch limit + 1
        query = query.limit(limit + 1);
        const snapshot = await query.get();

        const docs = snapshot.docs;
        const entities = docs.map((doc) => this.toDomain(doc.id, doc.data()));

        const paginatedResult = this.paginator.buildResult(
            docs.map((d) => ({ ...d.data(), id: d.id })),
            paginationOptions
        );

        return {
            data: entities,
            pagination: paginatedResult.pagination,
        };
    }

    async exists(id: string): Promise<boolean> {
        const doc = await this.getCollection().doc(id).get();
        return doc.exists;
    }

    async create(entity: TEntity): Promise<Result<TEntity, DomainError>> {
        const data = this.toPersistence(entity);
        // Ensure ID is used
        await this.getCollection().doc(entity.id).set(data);
        return ok(entity);
    }

    async update(entity: TEntity): Promise<Result<TEntity, DomainError>> {
        const exists = await this.exists(entity.id);
        if (!exists) {
            return err(new EntityNotFoundError(this.entityName, entity.id));
        }

        const data = this.toPersistence(entity);
        await this.getCollection().doc(entity.id).update(data);
        return ok(entity);
    }

    async delete(id: string): Promise<Result<void, DomainError>> {
        const exists = await this.exists(id);
        if (!exists) {
            return err(new EntityNotFoundError(this.entityName, id));
        }

        await this.getCollection().doc(id).delete();
        return ok(undefined);
    }

    async softDelete(id: string): Promise<Result<void, DomainError>> {
        const exists = await this.exists(id);
        if (!exists) {
            return err(new EntityNotFoundError(this.entityName, id));
        }

        await this.getCollection().doc(id).update({ deletedAt: new Date() });
        return ok(undefined);
    }

    async count(options?: QueryOptions<TProps>): Promise<number> {
        // Firestore count aggregation query
        let query: Query<DocumentData> = this.getCollection();

        if (options?.where) {
            for (const [key, value] of Object.entries(options.where)) {
                if (value !== undefined) {
                    query = query.where(key, '==', value);
                }
            }
        }

        const snapshot = await query.count().get();
        return snapshot.data().count;
    }
}
