import { getServiceOffering } from './queries/getServiceOffering.js';
import { getServiceOfferings } from './queries/getServiceOfferings.js';
import { getServiceAddOn } from './queries/getServiceAddOn.js';
import { getServiceAddOns } from './queries/getServiceAddOns.js';
import { getServicePackages } from './queries/getServicePackages.js';
import { createServiceOffering } from './mutations/createServiceOffering.js';
import { updateServiceOffering } from './mutations/updateServiceOffering.js';
import { deleteServiceOffering } from './mutations/deleteServiceOffering.js';
import { createServiceAddOn } from './mutations/createServiceAddOn.js';
import { updateServiceAddOn } from './mutations/updateServiceAddOn.js';
import { deleteServiceAddOn } from './mutations/deleteServiceAddOn.js';
import { createServicePackage } from './mutations/createServicePackage.js';
import { updateServicePackage } from './mutations/updateServicePackage.js';
import { deleteServicePackage } from './mutations/deleteServicePackage.js';
import { isActiveMember } from './serviceAccess.js';
import type { GraphQLContext } from '../../../types/context.js';
import type {
    ServiceOfferingParent, ServiceOfferingAddOnParent, ServicePackageParent,
} from '../../../types/service.js';

export const serviceResolvers = {
    Query: {
        getServiceOffering,
        getServiceOfferings,
        getServiceAddOn,
        getServiceAddOns,
        getServicePackages,
    },
    Mutation: {
        createServiceOffering,
        updateServiceOffering,
        deleteServiceOffering,
        createServiceAddOn,
        updateServiceAddOn,
        deleteServiceAddOn,
        createServicePackage,
        updateServicePackage,
        deleteServicePackage,
    },
    ServiceOffering: {
        // basePrice is Decimal-backed — Number() conversion, same pattern as Job.price.
        basePrice: (parent: ServiceOfferingParent) => (parent.basePrice == null ? null : Number(parent.basePrice)),
        // addOns/packages are relations no query/mutation here ever `include`s —
        // resolved lazily, same pattern as Job.pets. Filtered to isActive: true for
        // non-members, exactly matching getServiceAddOns/getServicePackages, so a
        // nested `serviceOffering { addOns { ... } }` selection can't leak inactive
        // rows to the public that the dedicated queries correctly hide.
        addOns: async (parent: ServiceOfferingParent, _: unknown, context: GraphQLContext) => {
            const memberView = await isActiveMember(parent.businessId, context);
            return context.prisma.serviceOfferingAddOn.findMany({
                where: { serviceOfferingId: parent.id, ...(memberView ? {} : { isActive: true }) },
            });
        },
        packages: async (parent: ServiceOfferingParent, _: unknown, context: GraphQLContext) => {
            const memberView = await isActiveMember(parent.businessId, context);
            return context.prisma.servicePackage.findMany({
                where: { serviceOfferingId: parent.id, ...(memberView ? {} : { isActive: true }) },
                orderBy: { sessionsCount: 'asc' },
            });
        },
    },
    ServiceOfferingAddOn: {
        pricePerSession: (parent: ServiceOfferingAddOnParent) => Number(parent.pricePerSession),
    },
    ServicePackage: {
        pricePerSession: (parent: ServicePackageParent) => Number(parent.pricePerSession),
    },
};
