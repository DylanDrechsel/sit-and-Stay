/**
 * Business management input types.
 */

/**
 * Input for updating a business's profile.
 * All fields except businessId are optional — only provided fields are written.
 */
export interface UpdateBusinessInput {
    businessId: string;
    name?: string;
    description?: string;
}

/**
 * Input for removing a member from a business.
 * memberId refers to the BusinessMember.id (the membership record), not the User.id.
 * Rules enforced in the resolver:
 *   - OWNER can remove MANAGERs and EMPLOYEEs
 *   - MANAGER can only remove EMPLOYEEs
 *   - No one can remove the OWNER
 */
export interface RemoveMemberInput {
    businessId: string;
    memberId: string;
}
