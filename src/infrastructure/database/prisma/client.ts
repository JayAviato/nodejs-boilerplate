/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRISMA CLIENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Singleton Prisma client with proper lifecycle management.
 */

import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from '../../config/env.config.js';
import { createLogger } from '../../logging/pino.logger.js';

const logger = createLogger('prisma');

/**
 * Create the Prisma client with logging and middleware
 */
function createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
        log: isDevelopment()
            ? [
                { level: 'query', emit: 'event' },
                { level: 'info', emit: 'event' },
                { level: 'warn', emit: 'event' },
                { level: 'error', emit: 'event' },
            ]
            : [
                { level: 'warn', emit: 'event' },
                { level: 'error', emit: 'event' },
            ],
        datasources: {
            db: {
                url: env.DATABASE_URL,
            },
        },
    });

    // Log queries in development
    if (isDevelopment()) {
        client.$on('query', (e: { query: string; params: string; duration: number }) => {
            logger.debug(`Query: ${e.query}`, {
                params: e.params,
                durationMs: e.duration,
            });
        });
    }

    client.$on('info', (e: { message: string }) => {
        logger.info(e.message);
    });

    client.$on('warn', (e: { message: string }) => {
        logger.warn(e.message);
    });

    client.$on('error', (e: { message: string }) => {
        logger.error(e.message);
    });

    return client;
}

/**
 * Singleton Prisma client instance
 */
export const prisma = createPrismaClient();

/**
 * Connect to the database
 */
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        logger.info('Database connection established');
    } catch (error) {
        logger.fatal('Failed to connect to database', error as Error);
        throw error;
    }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect();
        logger.info('Database connection closed');
    } catch (error) {
        logger.error('Error disconnecting from database', error as Error);
    }
}

/**
 * Execute operations within a transaction
 */
export async function withTransaction<T>(
    operation: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
    return prisma.$transaction(operation);
}
