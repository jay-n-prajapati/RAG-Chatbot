import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Single shared Drizzle client. Every DB access in the app should import
 * `db` from here rather than creating its own `pg` Pool/client — this is
 * the isolation point for swapping the database later.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export { schema };
