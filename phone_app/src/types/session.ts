/**
 * Types mirroring the backend GraphQL schema (backend/src/graphQL/typeDefs.ts).
 *
 * Hand-written and therefore able to drift — the schema is the authority. If
 * this surface grows much past auth, switch to GraphQL Code Generator rather
 * than maintaining these by hand.
 */

/** BusinessMember.role — per-business, not global. `User.globalRole` is unrelated. */
export type BusinessRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
}

export interface Business {
    id: string;
    name: string;
    city: string | null;
    heroPhotoUrl: string | null;
    isActive: boolean;
}

export interface BusinessMember {
    id: string;
    role: BusinessRole;
    isActive: boolean;
    /** ISO 8601 — the backend's DateTime scalar serializes to a string. */
    joinedAt: string;
    business: Business;
}

export interface CustomerProfile {
    id: string;
    address: string | null;
    city: string | null;
}

/**
 * The shape returned by `getSession`.
 *
 * Staff-ness and customer-ness are two INDEPENDENT facts, deliberately not
 * collapsed into a single role string — a user can be both, either, or neither:
 *
 *   memberships.length > 0  →  staff (each entry carries its own role)
 *   customerProfile != null →  customer
 *
 * An empty `memberships` does NOT imply "customer". A business owner created by
 * registerOwner has no CustomerProfile, and removeMember only soft-deletes, so a
 * removed owner legitimately has neither. Check `customerProfile` on its own.
 */
export interface Session {
    user: User;
    memberships: BusinessMember[];
    customerProfile: CustomerProfile | null;
}

export interface AuthPayload {
    token: string;
    user: User;
}
