import placesData from "../../../data/places.json";

/**
 * The UI takes a single free-text prompt (chat-style), but the backend's
 * /api/generate-itinerary contract stays structured — {place, days,
 * experience} — unchanged (see spec/itinerary-generator/decisions.md). This
 * module bridges the two with lightweight client-side heuristics rather
 * than a real NLP/LLM parse: a day-count regex, a substring match against
 * the known dataset place names, and a keyword match against known
 * experience tags. It doesn't need to be perfect — an unmatched or
 * mis-parsed place still round-trips through the backend's own vector
 * retrieval, which already has a graceful "no data for this place" path
 * for exactly this situation.
 */

const KNOWN_PLACES = (placesData as { place: string }[]).map((p) => {
  const primary = p.place.replace(/\s*\([^)]*\)/, "").trim();
  const alias = p.place.match(/\(([^)]+)\)/)?.[1]?.trim();
  return { display: primary, aliases: [primary, ...(alias ? [alias] : [])] };
});

const EXPERIENCE_KEYWORDS = [
  "adventure",
  "relaxing",
  "relax",
  "heritage",
  "spiritual",
  "wildlife",
  "beach",
  "hill station",
  "offbeat",
  "nature",
  "culture",
  "romantic",
  "nightlife",
  "backwaters",
  "desert",
];

const FILLER_WORDS = new Set([
  "please",
  "provide",
  "give",
  "plan",
  "me",
  "us",
  "my",
  "a",
  "an",
  "the",
  "for",
  "trip",
  "itinerary",
  "journey",
  "tour",
  "vacation",
  "holiday",
  "of",
  "at",
  "in",
  "to",
  "day",
  "days",
  "and",
  "with",
  "on",
]);

function extractDays(text: string): { days: number; match: string } | null {
  const match = text.match(/(\d{1,2})\s*[- ]?\s*days?\b/i);
  if (!match) return null;
  const days = Math.min(30, Math.max(1, parseInt(match[1], 10)));
  return { days, match: match[0] };
}

function extractPlace(text: string): string | null {
  const lower = text.toLowerCase();
  for (const { display, aliases } of KNOWN_PLACES) {
    if (aliases.some((alias) => lower.includes(alias.toLowerCase()))) {
      return display;
    }
  }
  const prepositional = text.match(/\b(?:at|in|to|for)\s+([a-z][a-z\s]*)$/i);
  return prepositional ? prepositional[1].trim() : null;
}

function extractExperience(text: string, place: string | null, daysMatch: string | null): string {
  const lower = text.toLowerCase();
  const keyword = EXPERIENCE_KEYWORDS.find((tag) => lower.includes(tag));
  if (keyword) return keyword;

  let remainder = text;
  if (daysMatch) remainder = remainder.replace(daysMatch, " ");
  if (place) remainder = remainder.replace(new RegExp(place, "ig"), " ");

  const words = remainder
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER_WORDS.has(w));

  return words.join(" ") || "general";
}

export type ParsedQuery = { place: string; days: number; experience: string };

export function parseFreeTextQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  const daysResult = extractDays(trimmed);
  const place = extractPlace(trimmed) ?? trimmed;
  const experience = extractExperience(trimmed, place, daysResult?.match ?? null);

  return { place, days: daysResult?.days ?? 3, experience };
}
