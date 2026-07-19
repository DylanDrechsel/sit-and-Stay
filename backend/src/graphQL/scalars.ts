import { GraphQLScalarType, Kind } from 'graphql';

/**
 * DateTime — serializes a JS Date to an ISO 8601 string.
 *
 * Replaces the previous plain `String` typing for timestamp fields, which relied on
 * graphql-js's default String scalar serializer. That serializer calls `.valueOf()` on
 * object-like values before `.toJSON()`, and `Date.prototype.valueOf()` returns epoch
 * milliseconds — so a raw Date passed into a `String` field silently came out as an
 * epoch-ms number string (e.g. "1784477086802") instead of an ISO date.
 */
export const DateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'ISO 8601 date-time string. Serializes a JS Date; parses a string or epoch-ms number back into one.',
    serialize(value: unknown): string {
        const date = value instanceof Date ? value : new Date(value as string | number);
        if (Number.isNaN(date.getTime())) {
            throw new TypeError('DateTime scalar can only serialize a valid Date, date string, or epoch timestamp');
        }
        return date.toISOString();
    },
    parseValue(value: unknown): Date {
        if (typeof value !== 'string' && typeof value !== 'number') {
            throw new TypeError('DateTime scalar can only parse string or number values');
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new TypeError('DateTime scalar received an invalid date value');
        }
        return date;
    },
    parseLiteral(ast): Date {
        if (ast.kind !== Kind.STRING && ast.kind !== Kind.INT) {
            throw new TypeError('DateTime scalar literal must be a string or int');
        }
        const date = new Date(ast.kind === Kind.INT ? Number(ast.value) : ast.value);
        if (Number.isNaN(date.getTime())) {
            throw new TypeError('DateTime scalar received an invalid date value');
        }
        return date;
    },
});
