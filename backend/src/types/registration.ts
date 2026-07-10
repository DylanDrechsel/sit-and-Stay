/**
 * User profile registration types.
 */
export interface RegisterCustomerInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface RegisterOwnerInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    businessName: string;
    businessDescription?: string;
}