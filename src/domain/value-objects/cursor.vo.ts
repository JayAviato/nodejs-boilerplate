/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CURSOR VALUE OBJECT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "A value object has no identity—it is defined entirely by its attributes.
 * Two cursors pointing to the same position are the same cursor."
 */

import { z } from 'zod';
import type { CursorDirection } from '../../shared/utils/cursor-pagination.util.js';

/**
 * Schema for validating cursor structure
 */
const cursorPayloadSchema = z.object({
    v: z.string(), // value
    d: z.enum(['forward', 'backward']), // direction
});

/**
 * Cursor Value Object
 *
 * Encapsulates the logic for encoding/decoding pagination cursors.
 * This is a value object—two cursors with the same value and direction are equal.
 */
export class Cursor {
    private constructor(
        private readonly _value: string,
        private readonly _direction: CursorDirection
    ) {
        Object.freeze(this);
    }

    /**
     * The raw cursor value (typically an ID or timestamp)
     */
    get value(): string {
        return this._value;
    }

    /**
     * The pagination direction
     */
    get direction(): CursorDirection {
        return this._direction;
    }

    /**
     * Create a new Cursor for forward pagination
     */
    static forward(value: string): Cursor {
        return new Cursor(value, 'forward');
    }

    /**
     * Create a new Cursor for backward pagination
     */
    static backward(value: string): Cursor {
        return new Cursor(value, 'backward');
    }

    /**
     * Decode a Base64 cursor string into a Cursor value object
     * @returns Cursor if valid, null if invalid
     */
    static decode(encoded: string): Cursor | null {
        try {
            const payload = Buffer.from(encoded, 'base64url').toString('utf-8');
            const parsed = cursorPayloadSchema.parse(JSON.parse(payload));
            return new Cursor(parsed.v, parsed.d);
        } catch {
            return null;
        }
    }

    /**
     * Encode this cursor to a Base64 string for API responses
     */
    encode(): string {
        const payload = JSON.stringify({
            v: this._value,
            d: this._direction,
        });
        return Buffer.from(payload).toString('base64url');
    }

    /**
     * Check equality with another cursor
     */
    equals(other: Cursor): boolean {
        return this._value === other._value && this._direction === other._direction;
    }

    /**
     * Create a copy with a different direction
     */
    withDirection(direction: CursorDirection): Cursor {
        return new Cursor(this._value, direction);
    }

    /**
     * String representation for debugging
     */
    toString(): string {
        return `Cursor(${this._direction}: ${this._value})`;
    }
}
