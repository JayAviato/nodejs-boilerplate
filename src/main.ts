/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APPLICATION ENTRY POINT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The beginning is the most important part of the work." — Plato
 *
 * This is where order emerges from chaos. We validate our environment,
 * connect to our dependencies, and start serving the world.
 */

import { createLogger } from './infrastructure/logging/pino.logger.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma/client.js';
import { startServer } from './presentation/http/server.js';
import { container, TOKENS } from './infrastructure/container/container.js';
import { loggerFactory } from './infrastructure/logging/pino.logger.js';

const logger = createLogger('main');

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
    logger.info('🔧 Initializing application...');

    // Register dependencies
    container.registerInstance(TOKENS.LoggerFactory, loggerFactory);
    container.registerSingleton(TOKENS.Logger, (c) =>
        c.resolve(TOKENS.LoggerFactory).create('app')
    );

    // Connect to database
    logger.info('📦 Connecting to database...');
    await connectDatabase();

    // Start HTTP server
    logger.info('🌐 Starting HTTP server...');
    await startServer();

    logger.info('✅ Application started successfully');
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        await disconnectDatabase();
        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', error as Error);
        process.exit(1);
    }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal('Unhandled rejection', reason as Error);
    process.exit(1);
});

// Start the application
bootstrap().catch((error) => {
    logger.fatal('Failed to start application', error as Error);
    process.exit(1);
});
