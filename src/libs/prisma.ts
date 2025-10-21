import { PrismaClient } from "@prisma/client";

// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
