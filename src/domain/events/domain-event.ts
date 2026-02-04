/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DOMAIN EVENTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Events are the atoms of history—immutable facts about what happened.
 * The past cannot be changed, only observed and reacted to."
 */

import { randomUUID } from 'crypto';

/**
 * Base interface for all domain events
 */
export interface IDomainEvent {
    /** Unique identifier for this event instance */
    readonly eventId: string;
    /** The type/name of the event */
    readonly eventType: string;
    /** ID of the aggregate that produced this event */
    readonly aggregateId: string;
    /** When the event occurred */
    readonly occurredAt: Date;
    /** Event version for schema evolution */
    readonly version: number;
}

/**
 * Abstract base class for domain events
 * Provides common functionality and enforces structure
 */
export abstract class BaseDomainEvent implements IDomainEvent {
    public readonly eventId: string;
    public readonly occurredAt: Date;
    public readonly version: number;

    constructor(
        public readonly aggregateId: string,
        version: number = 1
    ) {
        this.eventId = randomUUID();
        this.occurredAt = new Date();
        this.version = version;
    }

    /**
     * The event type name (must be implemented by subclasses)
     */
    abstract get eventType(): string;

    /**
     * Convert to a plain object for serialization
     */
    toJSON(): Record<string, unknown> {
        return {
            eventId: this.eventId,
            eventType: this.eventType,
            aggregateId: this.aggregateId,
            occurredAt: this.occurredAt.toISOString(),
            version: this.version,
        };
    }
}

/**
 * Domain event dispatcher interface
 * Implementations handle the actual dispatching of events
 */
export interface IDomainEventDispatcher {
    /**
     * Dispatch a single event
     */
    dispatch(event: IDomainEvent): Promise<void>;

    /**
     * Dispatch multiple events
     */
    dispatchMany(events: IDomainEvent[]): Promise<void>;
}

/**
 * Domain event handler interface
 */
export interface IDomainEventHandler<TEvent extends IDomainEvent> {
    /**
     * The event type this handler handles
     */
    readonly eventType: string;

    /**
     * Handle the event
     */
    handle(event: TEvent): Promise<void>;
}

/**
 * Example: Entity Created Event
 */
export class EntityCreatedEvent extends BaseDomainEvent {
    public readonly eventType = 'entity.created';

    constructor(
        aggregateId: string,
        public readonly entityType: string,
        public readonly payload: Record<string, unknown>
    ) {
        super(aggregateId);
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            entityType: this.entityType,
            payload: this.payload,
        };
    }
}

/**
 * Example: Entity Updated Event
 */
export class EntityUpdatedEvent extends BaseDomainEvent {
    public readonly eventType = 'entity.updated';

    constructor(
        aggregateId: string,
        public readonly entityType: string,
        public readonly changes: Record<string, unknown>
    ) {
        super(aggregateId);
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            entityType: this.entityType,
            changes: this.changes,
        };
    }
}

/**
 * Example: Entity Deleted Event
 */
export class EntityDeletedEvent extends BaseDomainEvent {
    public readonly eventType = 'entity.deleted';

    constructor(
        aggregateId: string,
        public readonly entityType: string
    ) {
        super(aggregateId);
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            entityType: this.entityType,
        };
    }
}
