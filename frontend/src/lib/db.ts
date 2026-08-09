import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL!;

// PostgreSQL client (postgres.js) with prepared-statement cache off for Next.js edge/runtime safety
const client = postgres(connectionString, { max: 1, prepare: false });
export const db = drizzle(client, { schema });
export type Db = typeof db;