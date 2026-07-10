import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import db from './utils/generatePrisma.js';
import { verifyToken } from './utils/auth.js';
import typeDefs from './graphQL/typeDefs.js';
import resolvers from './graphQL/resolvers/index.js';

dotenv.config();

const startApolloServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 4000;

    // ── Apollo / GraphQL ──────────────────────────────────────────────
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();

    // ── CORS ──────────────────────────────────────────────────────────
    const whitelist = [
        'http://localhost:3000',
        'http://localhost:5001/graphql',
        'https://studio.apollographql.com',
        'http://localhost:8000',
        'http://localhost:8080',
    ];

    app.use(cors({
        origin: whitelist,
        credentials: true,
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // ── REST: Health Check ────────────────────────────────────────────
    app.get('/health', async (_req, res) => {
        try {
            // Ping the database
            await db.$queryRaw`SELECT 1`;
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: 'connected',
            });
        } catch (err) {
            res.status(503).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                database: 'unreachable',
                error: err instanceof Error ? err.message : String(err),
            });
        }
    });

    // ── REST: Root ────────────────────────────────────────────────────
    app.get('/', (_req, res) => {
        res.json({
            message: 'PetSitterPro API',
            graphql: `/graphql`,
            health: `/health`,
        });
    });

    // ── GraphQL ───────────────────────────────────────────────────────
    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }) => {
                // Decode JWT from Authorization header if present
                // Resolvers receive context.user — null means unauthenticated
                const token = req.headers.authorization?.split(' ')[1] ?? null;
                const user = token ? verifyToken(token) : null;
                return { req, prisma: db, user };
            },
        })
    );

    // ── Start ─────────────────────────────────────────────────────────
    app.listen(PORT, () => {
        console.log(`🐾  PetSitterPro API running on http://localhost:${PORT}`);
        console.log(`🚀  GraphQL at http://localhost:${PORT}/graphql`);
        console.log(`💚  Health check at http://localhost:${PORT}/health`);
    });
};

startApolloServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});