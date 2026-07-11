import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;

// ── Password Helpers ───────────────────────────────────────────────────────

/**
 * Hashes a plain-text password using bcrypt.
 * @param password - Plain-text password from the user
 * @returns Bcrypt hash string
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * @param password - Plain-text password to check
 * @param hash - Stored bcrypt hash from the database
 * @returns true if they match, false otherwise
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

// ── JWT Helpers ────────────────────────────────────────────────────────────

export interface TokenPayload {
    userId: string;
    email: string;
    globalRole: string;
}

/**
 * Signs a JWT token containing the user's core identity.
 * Default expiry is 1 day (`1d`); override with the `JWT_EXPIRES_IN` env var.
 * Secret is pulled from `JWT_SECRET` env var.
 * @param payload - User identity fields to encode
 * @returns Signed JWT string
 */
export const signToken = (payload: TokenPayload): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    const expiresIn = process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] | undefined;
    return jwt.sign(payload, secret, expiresIn ? { expiresIn } : { expiresIn: '1d' });
};

/**
 * Verifies and decodes a JWT token.
 * Returns null instead of throwing if the token is invalid or expired.
 * @param token - JWT string from the Authorization header
 * @returns Decoded payload or null
 */
export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) return null;
        return jwt.verify(token, secret) as TokenPayload;
    } catch {
        return null;
    }
};
