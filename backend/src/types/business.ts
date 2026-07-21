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
    // Fallback share of a job's price paid to the assigned sitter, as a percent.
    // null clears it; undefined leaves it untouched.
    defaultSitterPayPercent?: number | null;
}

/**
 * Input for setting one member's own pay rate, overriding the business default.
 * memberId is the BusinessMember.id, not the User.id. A null payRatePercent
 * clears the override so the business default applies again.
 */
export interface SetMemberPayRateInput {
    businessId: string;
    memberId: string;
    payRatePercent: number | null;
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
    id: string;
    avgRating: unknown;
    serviceFeeAmount: unknown;
    defaultSitterPayPercent: unknown;
}

/**
 * Minimal parent shape for the BusinessMember type-level field resolvers: the
 * membership id the lazily-fetched `availability` relation is keyed on, plus
 * the fields `payRatePercent` needs to decide whether the caller may see it.
 */
export interface BusinessMemberParent {
    id: string;
    userId: string;
    businessId: string;
    payRatePercent: unknown;
    // Present only when the parent query include:d the relation — getSession
    // does, so its `business` field resolver can short-circuit instead of
    // re-querying per membership. Left opaque on purpose: the resolver hands it
    // straight to the Business type, whose own field map owns the Decimal
    // conversion, so modelling the columns again here would just be a second
    // copy to keep in sync.
    business?: object | null;
}
