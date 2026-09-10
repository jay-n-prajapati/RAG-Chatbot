import { pgTable, uuid, text, vector, jsonb } from "drizzle-orm/pg-core";

/**
 * Embedding dimension for Gemini's text-embedding-004 model.
 * See spec/initial-infra-setup/decisions.md.
 */
export const EMBEDDING_DIMENSIONS = 768;

export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
  experienceTags: text("experience_tags").array().notNull().default([]),
  /** The full curated dataset entry for this place (see data/places.json). */
  rawData: jsonb("raw_data").notNull(),
});
