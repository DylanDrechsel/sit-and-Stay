import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { TokenPayload } from '../utils/auth.js';

export interface GraphQLContext {
    req: Request;
    prisma: PrismaClient;
    user: TokenPayload | null; // null if request is unauthenticated
}
