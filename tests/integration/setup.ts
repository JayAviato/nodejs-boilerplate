/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTEGRATION TEST SETUP
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file provides utilities for integration testing, including
 * database setup/teardown and HTTP client helpers.
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import type { Express } from 'express';

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Setup for integration tests that need a database
 *
 * Usage:
 * ```ts
 * import { setupIntegrationTest } from '../setup';
 *
 * describe('User API', () => {
 *   setupIntegrationTest();
 *
 *   it('should create a user', async () => {
 *     // test code
 *   });
 * });
 * ```
 */
export function setupIntegrationTest() {
    // Note: In a real implementation, you would:
    // 1. Use a test database (e.g., Docker container or in-memory SQLite)
    // 2. Run migrations before tests
    // 3. Clear data between tests
    // 4. Disconnect after all tests

    beforeAll(async () => {
        // Connect to test database
        // await connectTestDatabase();
        console.log('Setting up integration test environment...');
    });

    afterAll(async () => {
        // Disconnect from test database
        // await disconnectTestDatabase();
        console.log('Tearing down integration test environment...');
    });

    beforeEach(async () => {
        // Clear all tables before each test
        // await clearDatabase();
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a test HTTP client for the Express app
 * In a real implementation, you would use supertest
 */
export interface TestClient {
    get: (path: string) => Promise<TestResponse>;
    post: (path: string, body?: unknown) => Promise<TestResponse>;
    put: (path: string, body?: unknown) => Promise<TestResponse>;
    delete: (path: string) => Promise<TestResponse>;
}

export interface TestResponse {
    status: number;
    body: unknown;
    headers: Record<string, string>;
}

/**
 * Create a test client for an Express app
 *
 * Note: In production, use supertest:
 * ```ts
 * import request from 'supertest';
 * const response = await request(app).get('/api/users');
 * ```
 */
export function createTestClient(_app: Express): TestClient {
    // This is a placeholder. In real code, use supertest.
    const createRequest = (method: string) => {
        return async (_path: string, _body?: unknown): Promise<TestResponse> => {
            console.log(`Mock ${method} request`);
            return {
                status: 200,
                body: {},
                headers: {},
            };
        };
    };

    return {
        get: createRequest('GET'),
        post: createRequest('POST'),
        put: createRequest('PUT'),
        delete: createRequest('DELETE'),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a mock logger that captures log calls
 */
export function createMockLogger() {
    const logs: { level: string; message: string; context?: unknown }[] = [];

    return {
        logs,
        trace: (message: string, context?: unknown) => {
            logs.push({ level: 'trace', message, context });
        },
        debug: (message: string, context?: unknown) => {
            logs.push({ level: 'debug', message, context });
        },
        info: (message: string, context?: unknown) => {
            logs.push({ level: 'info', message, context });
        },
        warn: (message: string, context?: unknown) => {
            logs.push({ level: 'warn', message, context });
        },
        error: (message: string, _error?: Error, context?: unknown) => {
            logs.push({ level: 'error', message, context });
        },
        fatal: (message: string, _error?: Error, context?: unknown) => {
            logs.push({ level: 'fatal', message, context });
        },
        child: () => createMockLogger(),
        setLevel: () => { },
        clear: () => {
            logs.length = 0;
        },
    };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`waitFor timed out after ${timeout}ms`);
}
