/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VALIDATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Trust nothing from the outside. Validate everything."
 *
 * This middleware validates request body, query, and params using Zod schemas.
 * If validation fails, it throws an error that the error handler will catch.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { type ZodSchema, ZodError } from 'zod';

/**
 * Validation targets - what parts of the request to validate
 */
export interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

/**
 * Create a validation middleware for the given schemas
 *
 * @example
 * ```ts
 * const createUserSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1),
 * });
 *
 * router.post('/users',
 *   validate({ body: createUserSchema }),
 *   createUserController
 * );
 * ```
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const errors: ZodError[] = [];

        // Validate body
        if (schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if (!result.success) {
                errors.push(result.error);
            } else {
                req.body = result.data;
            }
        }

        // Validate query
        if (schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if (!result.success) {
                errors.push(result.error);
            } else {
                // Update query with parsed values (handles type coercion)
                req.query = result.data as typeof req.query;
            }
        }

        // Validate params
        if (schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if (!result.success) {
                errors.push(result.error);
            } else {
                req.params = result.data as typeof req.params;
            }
        }

        // If there are any validation errors, combine and throw
        if (errors.length > 0) {
            // Merge all Zod errors into one
            const combinedIssues = errors.flatMap((e) => e.issues);
            const combinedError = new ZodError(combinedIssues);
            next(combinedError);
            return;
        }

        next();
    };
}

/**
 * Shorthand: Validate only body
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return validate({ body: schema });
}

/**
 * Shorthand: Validate only query
 */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
    return validate({ query: schema });
}

/**
 * Shorthand: Validate only params
 */
export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
    return validate({ params: schema });
}

/**
 * Type helper: Extract validated body type
 */
export type ValidatedBody<T extends ZodSchema> = Request & {
    body: import('zod').infer<T>;
};

/**
 * Type helper: Extract validated query type
 */
export type ValidatedQuery<T extends ZodSchema> = Request & {
    query: import('zod').infer<T>;
};
