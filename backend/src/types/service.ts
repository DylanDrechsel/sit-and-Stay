/**
 * Service offering, add-on, and package CRUD input types.
 */

/**
 * Input for creating a new ServiceOffering under a business.
 * category/basePrice/features are optional — basePrice is the headline
 * "from $X" price and enables single ad-hoc bookings.
 */
export interface CreateServiceOfferingInput {
    businessId: string;
    title: string;
    description: string;
    durationMinutes: number;
    category?: string;
    basePrice?: number;
    features?: string[];
}

/**
 * Input for updating a ServiceOffering.
 * All fields except serviceOfferingId are optional — only provided fields are
 * written. category and basePrice accept explicit null to clear; features,
 * when provided, replaces the whole array. Passing isActive: false is a soft
 * delete; the dedicated deleteServiceOffering mutation does the same with the
 * same permission checks.
 */
export interface UpdateServiceOfferingInput {
    serviceOfferingId: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
    category?: string | null;
    basePrice?: number | null;
    features?: string[];
    isActive?: boolean;
}

/**
 * Input for creating a new ServiceOfferingAddOn under a ServiceOffering.
 */
export interface CreateServiceAddOnInput {
    serviceOfferingId: string;
    title: string;
    pricePerSession: number;
    perSession?: boolean;
}

/**
 * Input for updating a ServiceOfferingAddOn.
 * All fields except serviceAddOnId are optional — only provided fields are written.
 */
export interface UpdateServiceAddOnInput {
    serviceAddOnId: string;
    title?: string;
    pricePerSession?: number;
    perSession?: boolean;
    isActive?: boolean;
}

/**
 * Input for creating a new ServicePackage (pricing tier) under a ServiceOffering.
 */
export interface CreateServicePackageInput {
    serviceOfferingId: string;
    title: string;
    sessionsCount?: number;
    pricePerSession: number;
}

/**
 * Input for updating a ServicePackage.
 * All fields except servicePackageId are optional — only provided fields are written.
 */
export interface UpdateServicePackageInput {
    servicePackageId: string;
    title?: string;
    sessionsCount?: number;
    pricePerSession?: number;
    isActive?: boolean;
}

// ── Type-level field resolver parent shapes ─────────────────────────────────

/**
 * Minimal parent shape for the ServiceOffering type-level field resolvers
 * (serviceResolvers.ts): lazy addOns/packages plus basePrice Decimal
 * conversion. businessId is needed so the lazy addOns/packages resolvers can
 * apply the same member-vs-public active filter as the dedicated
 * getServiceAddOns/getServicePackages queries.
 */
export interface ServiceOfferingParent {
    id: string;
    businessId: string;
    basePrice: unknown;
}

/**
 * Minimal parent shape for the ServiceOfferingAddOn type-level field
 * resolvers — pricePerSession is Decimal-backed and needs Number() conversion.
 */
export interface ServiceOfferingAddOnParent {
    pricePerSession: unknown;
}

/**
 * Minimal parent shape for the ServicePackage type-level field
 * resolvers — pricePerSession is Decimal-backed and needs Number() conversion.
 */
export interface ServicePackageParent {
    pricePerSession: unknown;
}
