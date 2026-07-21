import { z } from 'zod';

/**
 * Mirrors `loginSchema` in backend/src/utils/validate.ts field-for-field.
 *
 * The backend stays the authority — this copy exists purely so the user gets
 * per-field errors before a round trip (the server returns all failures as one
 * comma-separated BAD_USER_INPUT message, which can't be mapped back to inputs).
 *
 * Note the password rule is `min(1)`, NOT the full complexity rule used at
 * registration (min 8 / uppercase / number / special). That asymmetry is
 * deliberate and worth preserving: enforcing complexity at *login* would lock
 * out any account whose password predates the current rules, and would leak
 * what the rules are to someone guessing. Match the backend, don't "improve" it.
 */
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
