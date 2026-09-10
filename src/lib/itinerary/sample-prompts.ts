import { Anchor, Landmark, Mountain, PawPrint, Sunrise, TreePalm } from "lucide-react";
import type { ParsedQuery } from "./parse-query";

/** A clickable sample prompt: a natural-language label plus the exact
 * {place, days, experience} it maps to (bypasses parse-query.ts entirely,
 * since we already know the precise values — see decisions.md). */
export type SamplePrompt = ParsedQuery & { label: string; icon: typeof Mountain };

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  { label: "5-day adventure trip to Manali", place: "Manali", days: 5, experience: "adventure", icon: Mountain },
  { label: "4-day relaxing beach escape in Goa", place: "Goa", days: 4, experience: "relaxing beach", icon: TreePalm },
  { label: "3-day heritage tour of Jaipur", place: "Jaipur", days: 3, experience: "heritage", icon: Landmark },
  { label: "3-day spiritual journey in Varanasi", place: "Varanasi", days: 3, experience: "spiritual", icon: Sunrise },
  { label: "2-day wildlife safari in Ranthambore", place: "Ranthambore", days: 2, experience: "wildlife safari", icon: PawPrint },
  { label: "5-day island adventure in Andaman", place: "Andaman Islands", days: 5, experience: "island adventure", icon: Anchor },
];
