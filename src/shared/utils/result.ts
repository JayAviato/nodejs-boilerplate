/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESULT MONAD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Exceptions are GOTO statements in disguise. Results are honest."
 *
 * This is a functional approach to error handling. Instead of throwing
 * exceptions, we return a Result that is either Ok<T> or Err<E>.
 * This makes error handling explicit and type-safe.
 */

/**
 * Success result containing a value
 */
export interface Ok<T> {
    readonly ok: true;
    readonly value: T;
}

/**
 * Failure result containing an error
 */
export interface Err<E> {
    readonly ok: false;
    readonly error: E;
}

/**
 * Result type - either Ok<T> or Err<E>
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Create a success result
 */
export function ok<T>(value: T): Ok<T> {
    return { ok: true, value };
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Err<E> {
    return { ok: false, error };
}

/**
 * Type guard to check if result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok === true;
}

/**
 * Type guard to check if result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return result.ok === false;
}

/**
 * Unwrap the value from a Result, throwing if it's an Err
 * Use sparingly—prefer pattern matching
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (isOk(result)) {
        return result.value;
    }
    throw result.error;
}

/**
 * Unwrap the value or return a default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (isOk(result)) {
        return result.value;
    }
    return defaultValue;
}

/**
 * Map over a Result if it's Ok
 */
export function map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
): Result<U, E> {
    if (isOk(result)) {
        return ok(fn(result.value));
    }
    return result;
}

/**
 * Map over a Result if it's Err
 */
export function mapErr<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F
): Result<T, F> {
    if (isErr(result)) {
        return err(fn(result.error));
    }
    return result;
}

/**
 * Chain Result-returning functions (flatMap/bind)
 */
export function andThen<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
): Result<U, E> {
    if (isOk(result)) {
        return fn(result.value);
    }
    return result;
}

/**
 * Execute a side effect if Ok, returning the original Result
 */
export function tap<T, E>(
    result: Result<T, E>,
    fn: (value: T) => void
): Result<T, E> {
    if (isOk(result)) {
        fn(result.value);
    }
    return result;
}

/**
 * Wrap a potentially throwing function in a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
    try {
        return ok(fn());
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Wrap an async function that may throw in a Result
 */
export async function tryCatchAsync<T>(
    fn: () => Promise<T>
): Promise<Result<T, Error>> {
    try {
        return ok(await fn());
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Combine multiple Results into a single Result
 * Returns Ok with array of values if all are Ok, or the first Err
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
        if (isErr(result)) {
            return result;
        }
        values.push(result.value);
    }
    return ok(values);
}
