import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isSupabase = process.env.DATABASE_URL.includes("supabase");
const isPooler = process.env.DATABASE_URL.includes("pooler.supabase.com");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  // Pooler mode requires max 1 connection per serverless instance
  max: isPooler ? 1 : 10,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
