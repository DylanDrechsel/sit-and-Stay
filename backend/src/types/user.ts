/**
 * User profile update types.
 */
export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export interface ChangeEmailInput {
    newEmail: string;
    password: string; // current password — confirms identity before changing email
}
