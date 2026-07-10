import { PrismaClient } from '@prisma/client';

// Define the function that creates the client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['info', 'warn'],
    errorFormat: 'pretty',
  });
};

// Check if we already have an instance on the global object
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Use the existing global instance, or create a new one if it doesn't exist
const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

// In development, save the instance to the global object so it survives hot-reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db;
}