import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getNearbyBusinessesSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetNearbyBusinessesInput } from '../../../../types/business.js';

const METERS_PER_MILE = 1609.344;

interface NearbyBusinessRow {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    isVerified: boolean;
    heroPhotoUrl: string | null;
    addressLine: string | null;
    city: string | null;
    neighborhood: string | null;
    serviceFeeAmount: unknown; // Decimal-ish — converted by the Business type-level resolver, not here
    avgRating: unknown;        // Decimal-ish — same
    reviewCount: number;
    createdAt: Date;
    distanceMiles: unknown;    // computed by SQL; may come back as string or number depending on the driver
    fromPrice: unknown;        // Decimal-ish
}

/**
 * getNearbyBusinesses
 *
 * Finds active businesses within radiusMiles of the given point, nearest
 * first — the PostGIS-backed "browse nearby sitters" query behind the whole
 * customer discovery/home experience. Public — no authentication required,
 * same as getBusinessReviews (this is public storefront data).
 *
 * Prisma has no query-builder support for PostGIS geometry columns, so this
 * goes straight to `$queryRaw`. Every dynamic value — including the WHERE
 * fragments assembled conditionally for `category`/`search` — is composed
 * with `Prisma.sql`/`Prisma.join`, never string concatenation, so every value
 * remains a driver-parameterized placeholder. Do not "simplify" this by
 * building the WHERE clause with template-literal string interpolation.
 *
 * Distance strategy (the standard PostGIS idiom for this):
 *   - `ORDER BY location <-> point` uses the raw `geometry` column so Postgres
 *     can use the GiST index (`business_location_idx`) for fast KNN ordering.
 *   - `ST_DWithin`/`ST_Distance` cast to `::geography` so the radius filter and
 *     the returned distance are accurate real-world meters, not degrees.
 * A business with no `location` set can never match (`ST_DWithin` against a
 * NULL geography is NULL, i.e. not TRUE) — there's nothing to compute "nearby"
 * from, so it's excluded rather than erroring.
 */
export const getNearbyBusinesses = async (
    _: unknown,
    args: GetNearbyBusinessesInput,
    context: GraphQLContext,
) => {
    const parsed = getNearbyBusinessesSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { latitude, longitude, radiusMiles, category, search, limit } = parsed.data;
    const radiusMeters = radiusMiles * METERS_PER_MILE;

    const whereClauses: Prisma.Sql[] = [
        Prisma.sql`b."isActive" = true`,
        Prisma.sql`b."location" IS NOT NULL`,
        Prisma.sql`ST_DWithin(
            b."location"::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${radiusMeters}
        )`,
    ];

    if (category !== undefined) {
        whereClauses.push(Prisma.sql`EXISTS (
            SELECT 1 FROM "ServiceOffering" so
            WHERE so."businessId" = b."id" AND so."isActive" = true AND so."category" = ${category}::"ServiceCategory"
        )`);
    }

    if (search !== undefined) {
        whereClauses.push(Prisma.sql`b."name" ILIKE ${`%${search}%`}`);
    }

    const rows = await context.prisma.$queryRaw<NearbyBusinessRow[]>(Prisma.sql`
        SELECT
            b."id",
            b."name",
            b."description",
            b."isActive",
            b."isVerified",
            b."heroPhotoUrl",
            b."addressLine",
            b."city",
            b."neighborhood",
            b."serviceFeeAmount",
            b."avgRating",
            b."reviewCount",
            b."createdAt",
            ST_Distance(
                b."location"::geography,
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
            ) / ${METERS_PER_MILE} AS "distanceMiles",
            (
                SELECT MIN(so."basePrice")
                FROM "ServiceOffering" so
                WHERE so."businessId" = b."id" AND so."isActive" = true
            ) AS "fromPrice"
        FROM "Business" b
        WHERE ${Prisma.join(whereClauses, ' AND ')}
        ORDER BY b."location" <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        LIMIT ${limit}
    `);

    return rows.map((row) => ({
        business: {
            id: row.id,
            name: row.name,
            description: row.description,
            isActive: row.isActive,
            isVerified: row.isVerified,
            heroPhotoUrl: row.heroPhotoUrl,
            addressLine: row.addressLine,
            city: row.city,
            neighborhood: row.neighborhood,
            serviceFeeAmount: row.serviceFeeAmount,
            avgRating: row.avgRating,
            reviewCount: row.reviewCount,
            createdAt: row.createdAt,
        },
        distanceMiles: Number(row.distanceMiles),
        fromPrice: row.fromPrice == null ? null : Number(row.fromPrice),
    }));
};
