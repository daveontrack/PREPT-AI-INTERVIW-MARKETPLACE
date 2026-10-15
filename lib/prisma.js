import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;


//Imports a connection pool to manage and reuse database connections efficiently.
//Imports Prisma Client to query and manage database data.
//Connects the pool to Prisma using the adapter.
//Reuses an existing Prisma client if available; otherwise, creates a new one.
// The ?? operator means use the right side only if the left side is null or undefined.