/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENVIRONMENT CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Runtime is chaos. This is where we impose order."
 *
 * Zod validates environment variables at startup, failing fast if the
 * contract is violated. Types are inferred—no duplication, no drift.
 */

import { z } from 'zod';
import { config } from 'dotenv';

// Load .env file
config();

/**
 * Environment Schema
 * This is the single source of truth for all environment variables.
 * If it's not here, it doesn't exist.
 */
const envSchema = z.object({
    // ─────────────────────────────────────────────────────────────────────────
    // Application
    // ─────────────────────────────────────────────────────────────────────────
    NODE_ENV: z
        .enum(['development', 'test', 'staging', 'production'])
        .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().default('0.0.0.0'),

    // ─────────────────────────────────────────────────────────────────────────
    // Database
    // ─────────────────────────────────────────────────────────────────────────
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    DB_TYPE: z.enum(['postgres', 'mysql', 'mongo', 'firestore']).default('postgres'),

    // Firebase (Required only if DB_TYPE is firestore)
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    // ─────────────────────────────────────────────────────────────────────────
    // Logging
    // ─────────────────────────────────────────────────────────────────────────
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .default('info'),

    // ─────────────────────────────────────────────────────────────────────────
    // Security
    // ─────────────────────────────────────────────────────────────────────────
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // ─────────────────────────────────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(20),
    MAX_PAGE_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
});

/**
 * Parse and validate environment variables
 * This will throw a descriptive error if validation fails
 */
function parseEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.format();
        const errors = Object.entries(formatted)
            .filter(([key]) => key !== '_errors')
            .map(([key, value]) => {
                const errorValue = value as { _errors?: string[] };
                return `  - ${key}: ${errorValue._errors?.join(', ') ?? 'Invalid'}`;
            })
            .join('\n');

        console.error('❌ Environment validation failed:\n' + errors);
        process.exit(1);
    }

    return result.data;
}

/**
 * Validated environment configuration
 * Type is inferred from the Zod schema—zero duplication
 */
export const env = parseEnv();

/**
 * Inferred type for environment variables
 * Use this type when you need to pass env config around
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Type-safe environment access utilities
 */
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';
