/**
 * B2B employee onboarding lifecycle types.
 */
export interface InviteInput {
    email: string;
    role: string;
    businessId: string;
}

export interface AcceptInvitationInput {
    token: string;
    // Required for new users (no existing account); ignored for existing users
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export interface InvitationEmailPayload {
    toEmail: string;
    businessName: string;
    role: string;          // 'MANAGER' | 'EMPLOYEE'
    token: string;
    expiresAt: Date;
}