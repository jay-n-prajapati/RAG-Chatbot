CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"embedding" vector(768)
);
--> statement-breakpoint
CREATE INDEX "places_embedding_hnsw_idx" ON "places" USING hnsw ("embedding" vector_cosine_ops);
