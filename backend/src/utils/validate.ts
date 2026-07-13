import { z } from 'zod';

// ── Reusable field schemas ─────────────────────────────────────────────────

const emailField = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Invalid email address');
const passwordField = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');
const firstNameField = z.string().min(1, 'First name is required').max(50, 'First name too long');
const lastNameField = z.string().min(1, 'Last name is required').max(50, 'Last name too long');
const phoneField = z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number');

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
    phone: phoneField.optional(),
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
    phone: phoneField.optional(),
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
    role: z.string().refine((value) => value === 'MANAGER' || value === 'EMPLOYEE', {
        message: 'Role must be MANAGER or EMPLOYEE',
    }),
    businessId: z.string().min(1, 'Business ID is required'),
});

/**
 * Validates input for accepting an invitation and creating an account.
 * Used by employees/managers who received an invite token.
 *
 * Two paths:
 *   - New user:      token + password + firstName + lastName (+ optional phone) are all required.
 *   - Existing user: only token is needed — profile fields are ignored since they already exist.
 *
 * The resolver enforces per-path field requirements after determining whether the
 * invitee email already belongs to an existing account.
 */
export const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Invitation token is required'),
    // Optional at the Zod level — the resolver validates them for new users
    password: passwordField.optional(),
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
    phone: phoneField.optional(),
});

// ── User schemas ───────────────────────────────────────────────────────────

/**
 * Validates input for updating the authenticated user's profile.
 * 
 * Rules:
 * - All fields are optional — only provided fields are validated and written to the database.
 * - At least one field must be present in the request (enforced by object-level .refine()).
 * - 'avatarUrl' accepts full absolute URLs (e.g., https://...) OR local relative paths (e.g., /uploads/...).
 */
export const updateUserSchema = z.object({
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
    phone: z.union([phoneField, z.literal(''), z.null()]).optional(),
    avatarUrl: z.union([
        z.string()
            .trim()
            .refine(
                (val) => val.startsWith('/') || z.string().url().safeParse(val).success, 
                { message: 'Invalid avatar URL or path' }
            ),
        z.literal(''),
        z.null()
    ]).optional(),
}).refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided to update' },
);

/**
 * Validates input for changing the authenticated user's password.
 * Requires the current password for verification before accepting the new one.
 * Rejects if the new password is identical to the current one.
 */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
}).refine(
    (data) => data.currentPassword !== data.newPassword,
    { message: 'New password must be different from your current password', path: ['newPassword'] },
);

/**
 * Validates input for changing the authenticated user's email address.
 * newEmail is normalized (trimmed + lowercased) via emailField.
 * Requires the current password to confirm identity.
 */
export const changeEmailSchema = z.object({
    newEmail: emailField,
    password: z.string().min(1, 'Password is required'),
});

// ── Business schemas ───────────────────────────────────────────────────────

// Reusable field — all business operations require a valid businessId
const businessIdField = z.string().uuid('Invalid business ID');

// Reusable field — member removal requires a valid BusinessMember.id
const memberIdField = z.string().uuid('Invalid member ID');

/**
 * Validates input for updating a business's profile.
 * businessId is required; name and description are optional.
 * At least one of name or description must be provided (enforced by .refine()).
 */
export const updateBusinessSchema = z.object({
    businessId: businessIdField,
    name: z.string().trim().min(1, 'Business name cannot be empty').max(100, 'Business name too long').optional(),
    description: z.string().trim().max(500, 'Description too long').optional(),
}).refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: 'At least one field (name or description) must be provided to update' },
);

/**
 * Validates input for removing a member from a business.
 * memberId is the BusinessMember.id (the membership record), not the User.id.
 */
export const removeMemberSchema = z.object({
    businessId: businessIdField,
    memberId: memberIdField,
});

// ── Helper ─────────────────────────────────────────────────────────────────

/**
 * Formats a ZodError into a single readable string.
 * Used to pass clean error messages back through GraphQL.
 * @param error - ZodError from a .safeParse() call
 * @returns Comma-separated list of validation messages
 */
export const formatZodError = (error: z.ZodError): string => {
    const issues = Array.isArray((error as z.ZodError & { issues?: z.ZodIssue[] }).issues)
        ? (error as z.ZodError & { issues?: z.ZodIssue[] }).issues!
        : ((error as z.ZodError & { errors?: z.ZodIssue[] }).errors ?? []);

    return issues.map((issue) => issue.message).join(', ');
};
