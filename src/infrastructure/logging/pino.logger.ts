/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PINO LOGGER IMPLEMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The historian must be impartial but not silent."
 *
 * This is the infrastructure implementation of the logger port.
 * It uses Pino for high-performance structured logging.
 */

import { pino, type Logger as PinoLogger, type LoggerOptions } from 'pino';
import type { ILogger, ILoggerFactory, LogContext, LogLevel } from '../../application/ports/logger.port.js';
import { env, isDevelopment } from '../config/env.config.js';

/**
 * Pino logger implementation
 */
class PinoLoggerImpl implements ILogger {
    private logger: PinoLogger;

    constructor(logger: PinoLogger) {
        this.logger = logger;
    }

    trace(message: string, context?: LogContext): void {
        this.logger.trace(context ?? {}, message);
    }

    debug(message: string, context?: LogContext): void {
        this.logger.debug(context ?? {}, message);
    }

    info(message: string, context?: LogContext): void {
        this.logger.info(context ?? {}, message);
    }

    warn(message: string, context?: LogContext): void {
        this.logger.warn(context ?? {}, message);
    }

    error(message: string, error?: Error, context?: LogContext): void {
        this.logger.error(
            {
                ...context,
                err: error
                    ? {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                    }
                    : undefined,
            },
            message
        );
    }

    fatal(message: string, error?: Error, context?: LogContext): void {
        this.logger.fatal(
            {
                ...context,
                err: error
                    ? {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                    }
                    : undefined,
            },
            message
        );
    }

    child(context: LogContext): ILogger {
        return new PinoLoggerImpl(this.logger.child(context));
    }

    setLevel(level: LogLevel): void {
        this.logger.level = level;
    }
}

/**
 * Create the base Pino logger options
 */
function createLoggerOptions(): LoggerOptions {
    const baseOptions: LoggerOptions = {
        level: env.LOG_LEVEL,
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            env: env.NODE_ENV,
            service: 'enterprise-boilerplate',
        },
        formatters: {
            level: (label) => ({ level: label }),
        },
    };

    // In development, use pretty printing for readability
    if (isDevelopment()) {
        return {
            ...baseOptions,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        };
    }

    // In production, use JSON output for log aggregation
    return baseOptions;
}

/**
 * Root logger instance
 */
const rootLogger = pino(createLoggerOptions());

/**
 * Logger factory implementation
 */
class PinoLoggerFactory implements ILoggerFactory {
    create(name: string): ILogger {
        return new PinoLoggerImpl(rootLogger.child({ module: name }));
    }
}

/**
 * Singleton logger factory instance
 */
export const loggerFactory: ILoggerFactory = new PinoLoggerFactory();

/**
 * Create a logger with a specific name
 */
export function createLogger(name: string): ILogger {
    return loggerFactory.create(name);
}

/**
 * Default application logger
 */
export const logger: ILogger = createLogger('app');
