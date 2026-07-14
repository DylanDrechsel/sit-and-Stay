/**
 * Service offering and add-on CRUD input types.
 */

/**
 * Input for creating a new ServiceOffering under a business.
 */
export interface CreateServiceOfferingInput {
    businessId: string;
    title: string;
    description: string;
    durationMinutes: number;
}

/**
 * Input for updating a ServiceOffering.
 * All fields except serviceOfferingId are optional — only provided fields are written.
 * Passing isActive: false is a soft delete; use the dedicated deleteServiceOffering
 * mutation instead, which also enforces the same permission checks.
 */
export interface UpdateServiceOfferingInput {
    serviceOfferingId: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
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
