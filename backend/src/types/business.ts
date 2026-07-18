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

/**
 * Input for nearby-business discovery. radiusMiles and limit are optional at
 * the GraphQL layer (Zod applies defaults of 25 and 20 respectively).
 */
export interface GetNearbyBusinessesInput {
    latitude: number;
    longitude: number;
    radiusMiles?: number;
    category?: string;
    search?: string;
    limit?: number;
}

/**
 * Input for setting a business's PostGIS location — the only way to write
 * Business.location, since Prisma can't write Unsupported("geometry")
 * columns through its normal update API.
 */
export interface SetBusinessLocationInput {
    businessId: string;
    latitude: number;
    longitude: number;
}

/**
 * Minimal parent shape for the Business type-level field resolvers
 * (businessResolvers.ts) that convert Decimal-backed fields to Number.
 */
export interface BusinessParent {
    avgRating: unknown;
    serviceFeeAmount: unknown;
}
