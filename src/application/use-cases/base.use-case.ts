/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASE USE CASE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "A use case is a single intention—one thing the system does.
 * It orchestrates domain objects to achieve a specific outcome."
 *
 * Use cases are the application's API. They encapsulate all the logic
 * for a single user intention and return a Result.
 */

import type { Result } from '../../shared/utils/result.js';

/**
 * Base interface for all use cases
 *
 * @typeParam TInput - The input DTO type
 * @typeParam TOutput - The successful output type
 * @typeParam TError - The error type (defaults to Error)
 */
export interface IUseCase<TInput, TOutput, TError = Error> {
    execute(input: TInput): Promise<Result<TOutput, TError>>;
}

/**
 * Use case without input
 */
export interface IUseCaseNoInput<TOutput, TError = Error> {
    execute(): Promise<Result<TOutput, TError>>;
}

/**
 * Abstract base class for use cases
 * Provides common functionality and enforces structure
 *
 * @typeParam TInput - The input DTO type
 * @typeParam TOutput - The successful output type
 * @typeParam TError - The error type (defaults to Error)
 */
export abstract class BaseUseCase<TInput, TOutput, TError = Error>
    implements IUseCase<TInput, TOutput, TError> {
    /**
     * Execute the use case
     * Implements template method pattern with optional hooks
     */
    async execute(input: TInput): Promise<Result<TOutput, TError>> {
        // Pre-execution hook (e.g., logging, metrics)
        await this.beforeExecute(input);

        // Execute the main logic
        const result = await this.doExecute(input);

        // Post-execution hook
        await this.afterExecute(input, result);

        return result;
    }

    /**
     * The main execution logic - must be implemented by subclasses
     */
    protected abstract doExecute(input: TInput): Promise<Result<TOutput, TError>>;

    /**
     * Hook called before execution (override in subclasses)
     */
    protected async beforeExecute(_input: TInput): Promise<void> {
        // Default: no-op
    }

    /**
     * Hook called after execution (override in subclasses)
     */
    protected async afterExecute(
        _input: TInput,
        _result: Result<TOutput, TError>
    ): Promise<void> {
        // Default: no-op
    }
}

/**
 * Use case context for cross-cutting concerns
 */
export interface UseCaseContext {
    /** The ID of the authenticated user (if any) */
    userId?: string;
    /** Correlation ID for tracing */
    correlationId?: string;
    /** Request timestamp */
    timestamp: Date;
}

/**
 * Base class for use cases that require authentication context
 */
export abstract class AuthenticatedUseCase<TInput, TOutput, TError = Error>
    extends BaseUseCase<TInput, TOutput, TError> {
    protected readonly context: UseCaseContext;

    constructor(context: UseCaseContext) {
        super();
        this.context = context;
    }

    /**
     * Get the authenticated user ID
     * @throws Error if user is not authenticated
     */
    protected getUserId(): string {
        if (!this.context.userId) {
            throw new Error('User ID is required but not provided');
        }
        return this.context.userId;
    }
}
