/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HTTP SERVER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The server is the gateway—it receives requests from the chaotic
 * outside world and channels them into our ordered domain."
 */

import express, { type Application, type Request, type Response } from 'express';
import { env } from '../../infrastructure/config/env.config.js';
import { createLogger } from '../../infrastructure/logging/pino.logger.js';
import {
    errorHandlerMiddleware,
    notFoundHandler,
} from './middlewares/error-handler.middleware.js';

const logger = createLogger('http-server');

/**
 * Create and configure the Express application
 */
export function createApp(): Application {
    const app = express();

    // ─────────────────────────────────────────────────────────────────────────
    // Middleware
    // ─────────────────────────────────────────────────────────────────────────

    // Parse JSON bodies
    app.use(express.json({ limit: '10mb' }));

    // Parse URL-encoded bodies
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, _res, next) => {
        logger.info(`${req.method} ${req.path}`, {
            method: req.method,
            path: req.path,
            query: req.query,
        });
        next();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Health Check
    // ─────────────────────────────────────────────────────────────────────────

    app.get('/health', (_req: Request, res: Response) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: env.NODE_ENV,
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // API Routes
    // ─────────────────────────────────────────────────────────────────────────

    // TODO: Add your routes here
    // app.use('/api/v1/users', userRouter);
    // app.use('/api/v1/posts', postRouter);

    // Example route demonstrating cursor pagination
    app.get('/api/v1/example', (_req: Request, res: Response) => {
        res.json({
            success: true,
            message: 'Enterprise Node.js Boilerplate is running!',
            features: [
                'Clean Architecture',
                'Strict TypeScript',
                'Zod Validation',
                'Cursor Pagination',
                'Result Monad',
                'Domain Events',
                'Dependency Injection',
            ],
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Error Handling (must be last)
    // ─────────────────────────────────────────────────────────────────────────

    app.use(notFoundHandler);
    app.use(errorHandlerMiddleware);

    return app;
}

/**
 * Start the HTTP server
 */
export async function startServer(): Promise<void> {
    const app = createApp();

    return new Promise((resolve) => {
        app.listen(env.PORT, env.HOST, () => {
            logger.info(`🚀 Server listening on http://${env.HOST}:${env.PORT}`, {
                port: env.PORT,
                host: env.HOST,
                environment: env.NODE_ENV,
            });
            resolve();
        });
    });
}
