/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LOGGER PORT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "The logger is the historian. It records what happened so we may learn."
 *
 * This is a port (interface) for logging. The application layer depends
 * on this abstraction, and infrastructure provides the implementation.
 */

/**
 * Log levels in order of severity
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Context that can be attached to log entries
 */
export interface LogContext {
    /** Correlation ID for request tracing */
    correlationId?: string | undefined;
    /** User ID if authenticated */
    userId?: string | undefined;
    /** The operation being performed */
    operation?: string | undefined;
    /** Duration in milliseconds */
    durationMs?: number | undefined;
    /** Additional metadata */
    [key: string]: unknown;
}

/**
 * Logger port (interface)
 * Infrastructure layer will provide the implementation
 */
export interface ILogger {
    /**
     * Log a trace message (most verbose)
     */
    trace(message: string, context?: LogContext): void;

    /**
     * Log a debug message
     */
    debug(message: string, context?: LogContext): void;

    /**
     * Log an info message
     */
    info(message: string, context?: LogContext): void;

    /**
     * Log a warning message
     */
    warn(message: string, context?: LogContext): void;

    /**
     * Log an error message
     */
    error(message: string, error?: Error, context?: LogContext): void;

    /**
     * Log a fatal message (system is unusable)
     */
    fatal(message: string, error?: Error, context?: LogContext): void;

    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): ILogger;

    /**
     * Set the minimum log level
     */
    setLevel(level: LogLevel): void;
}

/**
 * Logger factory port
 */
export interface ILoggerFactory {
    /**
     * Create a logger with a specific name/module
     */
    create(name: string): ILogger;
}
