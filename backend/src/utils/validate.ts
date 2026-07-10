import { z } from 'zod';

// ── Reusable field schemas ─────────────────────────────────────────────────

const emailField = z.string().min(1, 'Email is required').email('Invalid email address');
const passwordField = z.string().min(8, 'Password must be at least 8 characters');
const firstNameField = z.string().min(1, 'First name is required').max(50, 'First name too long');
const lastNameField = z.string().min(1, 'Last name is required').max(50, 'Last name too long');
const phoneField = z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number').optional();

// ── Auth schemas ───────────────────────────────────────────────────────────

/**
 * Validates input for registering a new Customer account.
 * Creates a User (globalRole: USER) + CustomerProfile.
 */
export const registerCustomerSchema = z.object({
    email: emailField,
    password: passwordField,
    firstName: firstNameField,
    lastName: lastNameField,
    phone: phoneField,
});

/**
 * Validates input for registering a new Business Owner account.
 * Creates a User + Business + BusinessMember(OWNER) in a single transaction.
 */
export const registerOwnerSchema = z.object({
    email: emailField,
    password: passwordField,
    firstName: firstNameField,
    lastName: lastNameField,
    phone: phoneField,
    businessName: z.string().min(1, 'Business name is required').max(100, 'Business name too long'),
    businessDescription: z.string().max(500, 'Description too long').optional(),
});

/**
 * Validates input for logging in any user type.
 */
export const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1, 'Password is required'),
});

// ── Invitation schemas ─────────────────────────────────────────────────────

/**
 * Validates input for sending an employee invitation.
 * Can only be called by an OWNER or MANAGER of the business.
 */
export const inviteSchema = z.object({
    email: emailField,
    role: z.enum(['MANAGER', 'EMPLOYEE'], {
        errorMap: () => ({ message: 'Role must be MANAGER or EMPLOYEE' }),
    }),
    businessId: z.string().min(1, 'Business ID is required'),
});

/**
 * Validates input for accepting an invitation and creating an account.
 * Used by employees/managers who received an invite token.
 */
export const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Invitation token is required'),
    password: passwordField,
    firstName: firstNameField,
    lastName: lastNameField,
    phone: phoneField,
});

// ── Helper ─────────────────────────────────────────────────────────────────

/**
 * Formats a ZodError into a single readable string.
 * Used to pass clean error messages back through GraphQL.
 * @param error - ZodError from a .safeParse() call
 * @returns Comma-separated list of validation messages
 */
export const formatZodError = (error: z.ZodError): string => {
    return error.errors.map(e => e.message).join(', ');
};
