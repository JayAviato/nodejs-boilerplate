/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASE ENTITY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "An entity is not just data—it is an identity that persists through time.
 * Its equality is determined not by its attributes, but by its essence."
 *
 * Entities are domain objects with a distinct identity that runs through
 * time and different states. Two entities are equal if their identities match.
 */

import type { Timestamps } from '../../shared/types/index.js';

/**
 * Entity properties that all entities share
 */
export interface EntityProps {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Base abstract class for all domain entities
 *
 * @typeParam TProps - The properties interface for the specific entity
 */
export abstract class Entity<TProps extends EntityProps> {
    protected readonly _id: string;
    protected props: TProps;

    constructor(props: TProps) {
        this._id = props.id;
        this.props = {
            ...props,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    /**
     * Get the entity's unique identifier
     */
    get id(): string {
        return this._id;
    }

    /**
     * Get the creation timestamp
     */
    get createdAt(): Date {
        return this.props.createdAt ?? new Date();
    }

    /**
     * Get the last update timestamp
     */
    get updatedAt(): Date {
        return this.props.updatedAt ?? new Date();
    }

    /**
     * Get timestamps as an object
     */
    get timestamps(): Timestamps {
        return {
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Check equality based on identity, not attributes
     */
    equals(other: Entity<TProps>): boolean {
        if (other === null || other === undefined) {
            return false;
        }

        if (!(other instanceof Entity)) {
            return false;
        }

        return this._id === other._id;
    }

    /**
     * Update the updatedAt timestamp
     * Called internally when entity state changes
     */
    protected touch(): void {
        this.props.updatedAt = new Date();
    }

    /**
     * Convert entity to a plain object
     * Override in subclasses for custom serialization
     */
    abstract toObject(): TProps;
}

/**
 * Aggregate Root base class
 *
 * Aggregate roots are the entry points to aggregates. They are entities
 * that control access to a cluster of related objects and enforce invariants.
 */
export abstract class AggregateRoot<TProps extends EntityProps> extends Entity<TProps> {
    private _domainEvents: DomainEvent[] = [];

    /**
     * Get the domain events that have occurred on this aggregate
     */
    get domainEvents(): ReadonlyArray<DomainEvent> {
        return Object.freeze([...this._domainEvents]);
    }

    /**
     * Add a domain event to be dispatched
     */
    protected addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
    }

    /**
     * Clear all domain events (called after dispatch)
     */
    clearDomainEvents(): void {
        this._domainEvents = [];
    }
}

/**
 * Domain event interface
 * Events are immutable facts about something that happened in the domain
 */
export interface DomainEvent {
    readonly eventId: string;
    readonly eventType: string;
    readonly aggregateId: string;
    readonly occurredAt: Date;
    readonly payload: Record<string, unknown>;
}
