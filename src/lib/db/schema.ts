import { pgTable, uuid, text, vector } from "drizzle-orm/pg-core";

/**
 * Embedding dimension for Gemini's text-embedding-004 model.
 * See spec/initial-infra-setup/decisions.md.
 */
export const EMBEDDING_DIMENSIONS = 768;

export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
});
