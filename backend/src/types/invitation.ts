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
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}