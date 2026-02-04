/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SHARED TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Brand type for nominal typing
 * Prevents accidental type conflation (e.g., UserId vs PostId)
 */
export type Brand<T, B> = T & { readonly __brand: B };

/**
 * Branded string types for domain identifiers
 */
export type UserId = Brand<string, 'UserId'>;
export type PostId = Brand<string, 'PostId'>;

/**
 * Helper to create branded types
 */
export function createBrand<T, B>(value: T): Brand<T, B> {
    return value as Brand<T, B>;
}

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Make specified properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specified properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract the resolved type from a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Ensure type is not null or undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Dictionary type
 */
export type Dictionary<T> = Record<string, T>;

/**
 * Timestamp type for consistency
 */
export interface Timestamps {
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * Soft delete timestamp
 */
export interface SoftDelete {
    readonly deletedAt: Date | null;
}
