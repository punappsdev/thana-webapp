// lib/prisma.ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = (process.env.DATABASE_URL || "").replace(/^mysql:/, "mariadb:");
const adapter = new PrismaMariaDb(dbUrl);
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
