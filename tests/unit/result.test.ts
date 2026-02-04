/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESULT MONAD UNIT TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import {
    ok,
    err,
    isOk,
    isErr,
    unwrap,
    unwrapOr,
    map,
    mapErr,
    andThen,
    tap,
    tryCatch,
    tryCatchAsync,
    all,
    type Result,
} from '../../src/shared/utils/result';

describe('Result Monad', () => {
    describe('ok/err constructors', () => {
        it('should create Ok result', () => {
            const result = ok(42);
            expect(result.ok).toBe(true);
            expect(result.value).toBe(42);
        });

        it('should create Err result', () => {
            const error = new Error('something went wrong');
            const result = err(error);
            expect(result.ok).toBe(false);
            expect(result.error).toBe(error);
        });
    });

    describe('type guards', () => {
        it('isOk should return true for Ok', () => {
            const result = ok('success');
            expect(isOk(result)).toBe(true);
            expect(isErr(result)).toBe(false);
        });

        it('isErr should return true for Err', () => {
            const result = err(new Error('fail'));
            expect(isErr(result)).toBe(true);
            expect(isOk(result)).toBe(false);
        });
    });

    describe('unwrap', () => {
        it('should unwrap Ok value', () => {
            const result = ok({ data: 'test' });
            expect(unwrap(result)).toEqual({ data: 'test' });
        });

        it('should throw for Err', () => {
            const error = new Error('cannot unwrap');
            const result = err(error);
            expect(() => unwrap(result)).toThrow(error);
        });
    });

    describe('unwrapOr', () => {
        it('should return value for Ok', () => {
            const result = ok(10);
            expect(unwrapOr(result, 0)).toBe(10);
        });

        it('should return default for Err', () => {
            const result = err(new Error('fail'));
            expect(unwrapOr(result, 0)).toBe(0);
        });
    });

    describe('map', () => {
        it('should transform Ok value', () => {
            const result = ok(5);
            const mapped = map(result, (x) => x * 2);

            expect(isOk(mapped)).toBe(true);
            if (isOk(mapped)) {
                expect(mapped.value).toBe(10);
            }
        });

        it('should pass through Err', () => {
            const error = new Error('original');
            const result: Result<number, Error> = err(error);
            const mapped = map(result, (x: number) => x * 2);

            expect(isErr(mapped)).toBe(true);
            if (isErr(mapped)) {
                expect(mapped.error).toBe(error);
            }
        });
    });

    describe('mapErr', () => {
        it('should transform Err', () => {
            const result: Result<number, string> = err('not found');
            const mapped = mapErr(result, (e) => new Error(e));

            expect(isErr(mapped)).toBe(true);
            if (isErr(mapped)) {
                expect(mapped.error.message).toBe('not found');
            }
        });

        it('should pass through Ok', () => {
            const result: Result<number, string> = ok(42);
            const mapped = mapErr(result, (e: string) => new Error(e));

            expect(isOk(mapped)).toBe(true);
            if (isOk(mapped)) {
                expect(mapped.value).toBe(42);
            }
        });
    });

    describe('andThen (flatMap)', () => {
        const safeDivide = (a: number, b: number): Result<number, string> =>
            b === 0 ? err('division by zero') : ok(a / b);

        it('should chain successful operations', () => {
            const result = ok(10);
            const chained = andThen(result, (x) => safeDivide(x, 2));

            expect(isOk(chained)).toBe(true);
            if (isOk(chained)) {
                expect(chained.value).toBe(5);
            }
        });

        it('should short-circuit on Err', () => {
            const result: Result<number, string> = err('initial error');
            const chained = andThen(result, (x: number) => safeDivide(x, 2));

            expect(isErr(chained)).toBe(true);
            if (isErr(chained)) {
                expect(chained.error).toBe('initial error');
            }
        });

        it('should propagate error from chained function', () => {
            const result = ok(10);
            const chained = andThen(result, (x) => safeDivide(x, 0));

            expect(isErr(chained)).toBe(true);
            if (isErr(chained)) {
                expect(chained.error).toBe('division by zero');
            }
        });
    });

    describe('tap', () => {
        it('should execute side effect for Ok', () => {
            let sideEffect = 0;
            const result = ok(42);

            tap(result, (v) => { sideEffect = v; });

            expect(sideEffect).toBe(42);
        });

        it('should not execute side effect for Err', () => {
            let sideEffect = 0;
            const result: Result<number, Error> = err(new Error('fail'));

            tap(result, (v: number) => { sideEffect = v; });

            expect(sideEffect).toBe(0);
        });

        it('should return original result', () => {
            const original = ok('test');
            const returned = tap(original, () => { });

            expect(returned).toBe(original);
        });
    });

    describe('tryCatch', () => {
        it('should return Ok for successful function', () => {
            const result = tryCatch(() => JSON.parse('{"key": "value"}'));

            expect(isOk(result)).toBe(true);
            if (isOk(result)) {
                expect(result.value).toEqual({ key: 'value' });
            }
        });

        it('should return Err for throwing function', () => {
            const result = tryCatch(() => JSON.parse('invalid json'));

            expect(isErr(result)).toBe(true);
            if (isErr(result)) {
                expect(result.error).toBeInstanceOf(Error);
            }
        });
    });

    describe('tryCatchAsync', () => {
        it('should return Ok for successful async function', async () => {
            const result = await tryCatchAsync(async () => Promise.resolve(42));

            expect(isOk(result)).toBe(true);
            if (isOk(result)) {
                expect(result.value).toBe(42);
            }
        });

        it('should return Err for rejected promise', async () => {
            const result = await tryCatchAsync(async () =>
                Promise.reject(new Error('async error'))
            );

            expect(isErr(result)).toBe(true);
            if (isErr(result)) {
                expect(result.error.message).toBe('async error');
            }
        });
    });

    describe('all', () => {
        it('should combine all Ok results', () => {
            const results: Result<number, Error>[] = [ok(1), ok(2), ok(3)];
            const combined = all(results);

            expect(isOk(combined)).toBe(true);
            if (isOk(combined)) {
                expect(combined.value).toEqual([1, 2, 3]);
            }
        });

        it('should return first Err', () => {
            const error = new Error('second failed');
            const results: Result<number, Error>[] = [
                ok(1),
                err(error),
                ok(3),
            ];
            const combined = all(results);

            expect(isErr(combined)).toBe(true);
            if (isErr(combined)) {
                expect(combined.error).toBe(error);
            }
        });

        it('should handle empty array', () => {
            const combined = all([]);

            expect(isOk(combined)).toBe(true);
            if (isOk(combined)) {
                expect(combined.value).toEqual([]);
            }
        });
    });
});
