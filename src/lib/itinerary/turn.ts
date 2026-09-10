import type { Itinerary } from "./schema";
import type { ParsedQuery } from "./parse-query";

/**
 * A client-side chat "turn". The backend stays one-shot per request (see
 * spec/itinerary-generator/decisions.md — "Interaction model") — this type
 * is purely a UI transcript entry, not shared server-side chat state.
 */
export type TurnResult =
  | { kind: "loading" }
  | { kind: "no_data"; message: string }
  | { kind: "error"; message: string }
  | { kind: "ok"; itinerary: Itinerary };

export type Turn = {
  id: string;
  query: string;
  parsed: ParsedQuery;
  result: TurnResult;
};
