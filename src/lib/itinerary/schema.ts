import { z } from "zod";

/**
 * Structured output shape for a generated itinerary. Validated against
 * Gemini's JSON response before it reaches the client (see
 * spec/itinerary-generator/decisions.md — "Response validation").
 */
export const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  title: z.string(),
  activities: z.array(z.string()),
  meals: z.array(z.string()).optional(),
  tips: z.string().optional(),
});

export const ItinerarySchema = z.object({
  place: z.string(),
  days: z.number().int().positive(),
  experience: z.string(),
  itinerary: z.array(ItineraryDaySchema),
});

export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
