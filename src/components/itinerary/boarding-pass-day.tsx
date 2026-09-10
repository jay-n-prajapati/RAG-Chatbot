import type { ItineraryDay } from "@/lib/itinerary/schema";
import { ArrowRight, Check, Lightbulb, UtensilsCrossed } from "lucide-react";

/** Short "airport code"-style abbreviation, e.g. "Manali" → "MAN". */
function placeCode(place: string): string {
  const letters = place.replace(/[^a-zA-Z]/g, "");
  return (letters.slice(0, 3) || "TRP").toUpperCase();
}

/**
 * A single day rendered as a stylized boarding-pass ticket: a main stub with
 * the day's plan, a perforated tear-line with punched notches, and a small
 * "gate stub" repeating the day number and destination code — chosen by
 * the user over a plain card, timeline, or accordion treatment (see
 * spec/itinerary-generator/decisions.md — "Response card design").
 */
export function BoardingPassDay({
  day,
  place,
}: {
  day: ItineraryDay;
  place: string;
}) {
  const code = placeCode(place);
  const hasFooter = (day.meals && day.meals.length > 0) || day.tips;

  return (
    <div className="ring-gradient-warm relative flex overflow-hidden rounded-2xl  bg-card shadow-sm shadow-black/20">
      {/* main stub */}
      <div className="flex-1 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-4">
          <div className="font-heading text-3xl leading-none font-medium tabular-nums text-primary">
            {String(day.day).padStart(2, "0")}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              Day
            </p>
            <h3 className="font-heading text-lg leading-tight font-medium text-foreground">
              {day.title}
            </h3>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-border" />

        <ul className="space-y-1.5 text-sm text-foreground/90">
          {day.activities.map((activity, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-chart-3"
                strokeWidth={2.5}
              />
              {activity}
            </li>
          ))}
        </ul>

        {hasFooter && (
          <div className="my-3 border-t border-dashed border-border" />
        )}

        {day.meals && day.meals.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <UtensilsCrossed className="mt-0.5 size-3.5 shrink-0 text-chart-3" />
            {day.meals.join(" · ")}
          </div>
        )}
        {day.tips && (
          <div className="mt-2 flex items-start gap-2 text-xs text-accent-foreground/80">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-accent" />
            {day.tips}
          </div>
        )}
      </div>

      {/* perforated tear-line with punched notches */}
      <div className="relative w-0 shrink-0 border-l border-dashed border-border">
        <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-background" />
        <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-background" />
      </div>

      {/* gate stub */}
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-secondary/60 px-2 py-4 sm:w-24">
        <p className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
          Day
        </p>
        <p className="font-heading text-xl font-medium tabular-nums text-primary">
          {String(day.day).padStart(2, "0")}
        </p>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.15em] text-foreground">
          {code}
        </p>
        <ArrowRight className="mt-1 size-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
