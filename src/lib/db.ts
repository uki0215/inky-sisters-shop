import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: any =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  db.$on('query', (e: any) => {
    console.log(
      `\n[PRISMA QUERY] ${e.duration}ms\n${e.query}\n`
    );
  });
}

globalForPrisma.prisma = db;