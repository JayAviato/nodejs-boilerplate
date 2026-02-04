/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DOMAIN ERROR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "An error is not a failure—it is information. Domain errors are the
 * language through which the domain speaks its constraints."
 *
 * Domain errors represent business rule violations and invariant failures.
 * They are part of the domain vocabulary.
 */

/**
 * Error codes for domain-level errors
 * These are semantic codes that represent business rule violations
 */
export enum DomainErrorCode {
    // Entity errors
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    ENTITY_ALREADY_EXISTS = 'ENTITY_ALREADY_EXISTS',
    ENTITY_VALIDATION_FAILED = 'ENTITY_VALIDATION_FAILED',

    // Business rule violations
    INVARIANT_VIOLATION = 'INVARIANT_VIOLATION',
    PRECONDITION_FAILED = 'PRECONDITION_FAILED',
    OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

    // Value object errors
    INVALID_VALUE = 'INVALID_VALUE',
    VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',
}

/**
 * Metadata that can be attached to domain errors
 */
export interface DomainErrorMetadata {
    /** The entity type involved in the error */
    entityType?: string | undefined;
    /** The entity ID if applicable */
    entityId?: string | undefined;
    /** The field that caused the error */
    field?: string | undefined;
    /** Additional context */
    context?: Record<string, unknown> | undefined;
}

/**
 * Base class for all domain errors
 *
 * Domain errors are recoverable, expected errors that represent
 * business rule violations. They should never be thrown for
 * programming errors or infrastructure failures.
 */
export class DomainError extends Error {
    public readonly code: DomainErrorCode;
    public readonly metadata: DomainErrorMetadata;
    public readonly timestamp: Date;

    constructor(
        code: DomainErrorCode,
        message: string,
        metadata: DomainErrorMetadata = {}
    ) {
        super(message);
        this.name = 'DomainError';
        this.code = code;
        this.metadata = metadata;
        this.timestamp = new Date();

        // Maintain proper stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert to a plain object for logging/serialization
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            metadata: this.metadata,
            timestamp: this.timestamp.toISOString(),
        };
    }
}

/**
 * Entity not found error
 */
export class EntityNotFoundError extends DomainError {
    constructor(entityType: string, entityId: string) {
        super(
            DomainErrorCode.ENTITY_NOT_FOUND,
            `${entityType} with ID '${entityId}' was not found`,
            { entityType, entityId }
        );
        this.name = 'EntityNotFoundError';
    }
}

/**
 * Entity already exists error
 */
export class EntityAlreadyExistsError extends DomainError {
    constructor(entityType: string, identifier: string) {
        super(
            DomainErrorCode.ENTITY_ALREADY_EXISTS,
            `${entityType} with identifier '${identifier}' already exists`,
            { entityType, context: { identifier } }
        );
        this.name = 'EntityAlreadyExistsError';
    }
}

/**
 * Validation failed error
 */
export class DomainValidationError extends DomainError {
    constructor(message: string, field?: string) {
        super(DomainErrorCode.ENTITY_VALIDATION_FAILED, message, field !== undefined ? { field } : {});
        this.name = 'DomainValidationError';
    }
}

/**
 * Business rule/invariant violation
 */
export class InvariantViolationError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(DomainErrorCode.INVARIANT_VIOLATION, message, context !== undefined ? { context } : {});
        this.name = 'InvariantViolationError';
    }
}
