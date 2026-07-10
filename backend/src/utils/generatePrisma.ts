import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Create a single node-postgres pool outside the singleton
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
});
const adapter = new PrismaPg(pool);

// 2. Define the function that creates the client using the adapter
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter, // <-- Prisma 7 requires this driver adapter here
    log: ['info', 'warn'],
    errorFormat: 'pretty',
  });
};

// 3. Keep your global object type declaration exactly the same
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// 4. Reuse or create the global instance
const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

// 5. Save it to globalThis in development to survive hot-reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db;
}