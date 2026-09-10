import type { Turn } from "@/lib/itinerary/turn";
import { CircleAlert, Compass, User } from "lucide-react";
import { BoardingPassDay } from "./boarding-pass-day";

export function TurnView({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[85%] space-y-1 text-right">
          <div className="ml-auto w-fit rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            {turn.query}
          </div>
        </div>
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-primary ring-1 ring-border">
          <User className="size-3.5" strokeWidth={2.25} />
        </span>
      </div>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-primary ring-1 ring-border">
          <Compass className="size-3.5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          {turn.result.kind === "loading" && (
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span
                  className="animate-dot-bounce size-1.5 rounded-full bg-primary"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="animate-dot-bounce size-1.5 rounded-full bg-primary"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="animate-dot-bounce size-1.5 rounded-full bg-primary"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              Charting your route…
            </div>
          )}

          {turn.result.kind === "no_data" && (
            <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {turn.result.message}
            </div>
          )}

          {turn.result.kind === "error" && (
            <div className="flex items-start gap-2 rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {turn.result.message}
            </div>
          )}

          {turn.result.kind === "ok" && (
            <div className="space-y-4">
              {turn.result.itinerary.itinerary.map((day) => (
                <BoardingPassDay
                  key={day.day}
                  day={day}
                  place={turn.parsed.place}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
