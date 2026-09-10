import { z } from "zod";

/**
 * Shape of one entry in data/places.json — the curated grounding dataset.
 * Also the shape stored in `places.raw_data` (see src/lib/db/schema.ts).
 */
export const PlaceDataSchema = z.object({
  place: z.string(),
  experienceTags: z.array(z.string()),
  bestDuration: z.string(),
  attractions: z.array(z.string()),
  activities: z.array(z.string()),
  food: z.array(z.string()),
  tips: z.string(),
});

export type PlaceData = z.infer<typeof PlaceDataSchema>;

export const PlaceDataArraySchema = z.array(PlaceDataSchema);
