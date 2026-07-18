/**
 * Customer-domain shared types.
 */

/**
 * Minimal parent shape for the CustomerProfile type-level field resolvers
 * (customerResolvers.ts) that lazily resolve the owning User.
 */
export interface CustomerProfileParent {
    id: string;
    userId: string;
}
