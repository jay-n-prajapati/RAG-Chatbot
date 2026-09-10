"use client";

import { useEffect, useRef, useState } from "react";
import { Compass } from "lucide-react";
import { Composer } from "@/components/itinerary/composer";
import { TurnView } from "@/components/itinerary/turn-view";
import { SamplePromptGrid } from "@/components/itinerary/sample-prompt-grid";
import { parseFreeTextQuery, type ParsedQuery } from "@/lib/itinerary/parse-query";
import type { SamplePrompt } from "@/lib/itinerary/sample-prompts";
import type { Turn, TurnResult } from "@/lib/itinerary/turn";

export default function Home() {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const isLoading = turns.some((t) => t.result.kind === "loading");
  const hasStarted = turns.length > 0;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function runTurn(displayQuery: string, parsed: ParsedQuery) {
    const id = crypto.randomUUID();
    setTurns((prev) => [...prev, { id, query: displayQuery, parsed, result: { kind: "loading" } }]);

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();

      let result: TurnResult;
      if (!res.ok) {
        result = { kind: "error", message: data.error ?? "Something went wrong." };
      } else if (data.status === "no_data") {
        result = { kind: "no_data", message: data.message };
      } else {
        result = { kind: "ok", itinerary: data.itinerary };
      }
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, result } : t)));
    } catch {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, result: { kind: "error", message: "Network error — is the app running?" } }
            : t,
        ),
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (isLoading || !trimmed) return;
    void runTurn(trimmed, parseFreeTextQuery(trimmed));
    setQuery("");
  }

  function handleSamplePrompt(sample: SamplePrompt) {
    if (isLoading) return;
    void runTurn(sample.label, sample);
  }

  return (
    <div className="bg-grain relative flex min-h-screen flex-col bg-background">
      {/* ambient marigold glow, purely decorative */}
      <div
        aria-hidden
        className="animate-glow-pulse pointer-events-none absolute top-[-10%] left-1/2 z-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Compass className="size-4" strokeWidth={2.25} />
          </span>
          <span className="font-heading text-xl tracking-tight text-foreground italic">Yatra</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6 sm:px-6">
        {!hasStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-10 py-10 text-center">
            <div className="animate-rise-in space-y-3">
              <p className="text-sm tracking-[0.2em] text-muted-foreground uppercase">
                AI trip planner for India
              </p>
              <h1 className="font-heading text-4xl leading-[1.1] font-medium text-foreground italic sm:text-5xl">
                Where shall we wander?
              </h1>
              <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
                Just ask — &ldquo;3 day adventure trip to Manali&rdquo; — grounded in a
                hand-curated set of Indian places, not guesswork.
              </p>
            </div>

            <div className="animate-rise-in w-full" style={{ animationDelay: "80ms" }}>
              <Composer query={query} setQuery={setQuery} onSubmit={handleSubmit} disabled={isLoading} />
            </div>

            <SamplePromptGrid onSelect={handleSamplePrompt} disabled={isLoading} />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 py-6">
              {turns.map((turn) => (
                <TurnView key={turn.id} turn={turn} />
              ))}
              <div ref={transcriptEndRef} />
            </div>

            <div className="sticky bottom-0 border-t border-border bg-background/90 pt-4 pb-2 backdrop-blur-sm">
              <Composer query={query} setQuery={setQuery} onSubmit={handleSubmit} disabled={isLoading} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
