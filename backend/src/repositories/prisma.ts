/**
 * Shared Prisma client.
 *
 * Every repository module imports this single instance — one connection pool
 * for the whole process, which matters on hosted Postgres (Supabase) where
 * connection counts are capped.
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
