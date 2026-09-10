ALTER TABLE "places" ADD COLUMN "experience_tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "raw_data" jsonb NOT NULL;