import { GraphQLError } from 'graphql';
import { hashPassword, signToken } from '../../../../utils/auth.js';
import { registerOwnerSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { RegisterOwnerInput } from '../../../../types/registration.js';

/**
 * registerOwner
 * Creates a User + Business + BusinessMember(OWNER) in one transaction.
 * Returns a signed JWT + the new user + the new business.
 */
export const registerOwner = async (
    _: unknown,
    { input }: { input: RegisterOwnerInput },
    context: GraphQLContext,
) => {
    // 1. Validate
    const parsed = registerOwnerSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { email, password, firstName, lastName, phone, businessName, businessDescription } = parsed.data;

    // 2. Check email uniqueness
    const existing = await context.prisma.user.findUnique({ where: { email } });
    if (existing != null) {
        throw new GraphQLError('An account with this email already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // 3. Hash password and create User + Business + BusinessMember atomically
    const passwordHash = await hashPassword(password);

    const { user, business } = await context.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: { email, passwordHash, firstName, lastName, phone: phone ?? null, globalRole: 'USER' },
        });
        const newBusiness = await tx.business.create({
            data: { name: businessName, description: businessDescription ?? null },
        });
        await tx.businessMember.create({
            data: {
                userId: newUser.id,
                businessId: newBusiness.id,
                role: 'OWNER',
                isActive: true,
            },
        });
        // Create default service offerings for the new business (inactive by default)
        const boarding = await tx.serviceOffering.create({
            data: {
                businessId: newBusiness.id,
                title: 'Boarding',
                description: 'Customer is away; employee picks up animals and watches them at their home.',
                durationMinutes: 1440,
                isActive: false,
            },
        });
        const houseSitting = await tx.serviceOffering.create({
            data: {
                businessId: newBusiness.id,
                title: 'House Sitting',
                description: "Employee watches the animal(s) at the customer's home while they are away.",
                durationMinutes: 1440,
                isActive: false,
            },
        });
        const dropIn = await tx.serviceOffering.create({
            data: {
                businessId: newBusiness.id,
                title: 'Drop-In Visits',
                description: "Employee visits the customer's house for a short visit to care for the animal(s).",
                durationMinutes: 30,
                isActive: false,
            },
        });
        const dayCare = await tx.serviceOffering.create({
            data: {
                businessId: newBusiness.id,
                title: 'Doggy Day Care',
                description: "Customer drops animals off at the employee's house and picks them up later the same day.",
                durationMinutes: 480,
                isActive: false,
            },
        });
        const dogWalking = await tx.serviceOffering.create({
            data: {
                businessId: newBusiness.id,
                title: 'Dog Walking',
                description: "Employee comes to the customer's house to walk or care for the animal(s).",
                durationMinutes: 30,
                isActive: false,
            },
        });
        const dogTraining = await tx.serviceOffering.create({
            data: {
                businessId: newBusiness.id,
                title: 'Dog Training',
                description: "Dog trainer provides training at the customer's home or at the trainer's location.",
                durationMinutes: 60,
                isActive: false,
            },
        });

        // Create packages and add-ons for Dog Training
        await tx.servicePackage.createMany({
            data: [
                {
                    serviceOfferingId: dogTraining.id,
                    title: 'Single Session',
                    sessionsCount: 1,
                    pricePerSession: '88.00',
                    isActive: false,
                },
                {
                    serviceOfferingId: dogTraining.id,
                    title: '4 Session Package',
                    sessionsCount: 4,
                    pricePerSession: '82.00',
                    isActive: false,
                },
                {
                    serviceOfferingId: dogTraining.id,
                    title: '6 Session Package',
                    sessionsCount: 6,
                    pricePerSession: '80.00',
                    isActive: false,
                },
            ],
        });
        await tx.serviceOfferingAddOn.create({
            data: {
                serviceOfferingId: dogTraining.id,
                title: 'Additional Dog',
                pricePerSession: '50.00',
                perSession: true,
                isActive: false,
            },
        });

        // Create packages for Dog Walking
        await tx.servicePackage.createMany({
            data: [
                {
                    serviceOfferingId: dogWalking.id,
                    title: 'Single (once a week)',
                    sessionsCount: 1,
                    pricePerSession: '30.00',
                    isActive: false,
                },
                {
                    serviceOfferingId: dogWalking.id,
                    title: '2/3 Times a Week',
                    sessionsCount: 1,
                    pricePerSession: '28.00',
                    isActive: false,
                },
                {
                    serviceOfferingId: dogWalking.id,
                    title: '4/5 Times a Week',
                    sessionsCount: 1,
                    pricePerSession: '25.00',
                    isActive: false,
                },
            ],
        });
        return { user: newUser, business: newBusiness };
    });

    const token = signToken({ userId: user.id, email: user.email, globalRole: user.globalRole });
    return { token, user, business };
};
