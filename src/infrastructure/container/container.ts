/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEPENDENCY INJECTION CONTAINER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Dependencies should flow inward. The container orchestrates this flow."
 *
 * A simple, type-safe DI container without external dependencies.
 * For production, consider using tsyringe or inversify.
 *
 * MULTI-DATABASE STRATEGY:
 * To support multiple databases, register repositories based on `env.DB_TYPE`.
 * Example:
 * if (env.DB_TYPE === 'firestore') {
 *   container.registerSingleton(TOKENS.UserRepo, () => new FirestoreUserRepository());
 * } else {
 *   container.registerSingleton(TOKENS.UserRepo, () => new PrismaUserRepository());
 * }
 */

/**
 * Token type for dependency registration
 */
export type Token<T> = symbol & { __type?: T };

/**
 * Create a typed injection token
 */
export function createToken<T>(description: string): Token<T> {
    return Symbol(description) as Token<T>;
}

/**
 * Factory function type
 */
type Factory<T> = (container: Container) => T;

/**
 * Dependency lifecycle
 */
type Lifecycle = 'singleton' | 'transient';

/**
 * Registration entry
 */
interface Registration<T> {
    factory: Factory<T>;
    lifecycle: Lifecycle;
    instance?: T;
}

/**
 * Simple DI Container
 */
export class Container {
    private registrations = new Map<symbol, Registration<unknown>>();

    /**
     * Register a singleton (single instance for entire app lifetime)
     */
    registerSingleton<T>(token: Token<T>, factory: Factory<T>): this {
        this.registrations.set(token, { factory, lifecycle: 'singleton' });
        return this;
    }

    /**
     * Register a transient (new instance each time)
     */
    registerTransient<T>(token: Token<T>, factory: Factory<T>): this {
        this.registrations.set(token, { factory, lifecycle: 'transient' });
        return this;
    }

    /**
     * Register an existing instance as a singleton
     */
    registerInstance<T>(token: Token<T>, instance: T): this {
        this.registrations.set(token, {
            factory: () => instance,
            lifecycle: 'singleton',
            instance,
        });
        return this;
    }

    /**
     * Resolve a dependency
     */
    resolve<T>(token: Token<T>): T {
        const registration = this.registrations.get(token) as Registration<T> | undefined;

        if (!registration) {
            throw new Error(`No registration found for token: ${token.toString()}`);
        }

        if (registration.lifecycle === 'singleton') {
            if (!registration.instance) {
                registration.instance = registration.factory(this);
            }
            return registration.instance;
        }

        return registration.factory(this);
    }

    /**
     * Check if a token is registered
     */
    isRegistered<T>(token: Token<T>): boolean {
        return this.registrations.has(token);
    }

    /**
     * Clear all registrations (useful for testing)
     */
    clear(): void {
        this.registrations.clear();
    }
}

/**
 * Global container instance
 */
export const container = new Container();

// ═══════════════════════════════════════════════════════════════════════════
// TOKENS
// ═══════════════════════════════════════════════════════════════════════════

import type { ILogger, ILoggerFactory } from '../../application/ports/logger.port.js';
import type { ISocketService } from '../../application/ports/socket.port.js';

export const TOKENS = {
    Logger: createToken<ILogger>('Logger'),
    LoggerFactory: createToken<ILoggerFactory>('LoggerFactory'),
    // Repositories...
    SocketService: createToken<ISocketService>('SocketService'),
} as const;

import { SocketIOService } from '../socket/socket.io.service.js';
container.registerSingleton(TOKENS.SocketService, () => new SocketIOService());
