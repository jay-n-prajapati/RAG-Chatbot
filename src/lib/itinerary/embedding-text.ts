import type { PlaceData } from "./place-data";

/**
 * Builds the single embeddable chunk of text for a place — the whole
 * curated entry, per the one-chunk-per-place decision (see
 * spec/itinerary-generator/decisions.md).
 */
export function buildPlaceEmbeddingText(place: PlaceData): string {
  return [
    `Place: ${place.place}`,
    `Experience: ${place.experienceTags.join(", ")}`,
    `Best duration: ${place.bestDuration}`,
    `Attractions: ${place.attractions.join(", ")}`,
    `Activities: ${place.activities.join(", ")}`,
    `Food: ${place.food.join(", ")}`,
    `Tips: ${place.tips}`,
  ].join("\n");
}

/** Builds the retrieval query text from the user's form input. */
export function buildQueryEmbeddingText(place: string, experience: string): string {
  return `${place} — ${experience}`;
}
