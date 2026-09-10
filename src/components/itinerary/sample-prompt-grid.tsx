import { SAMPLE_PROMPTS, type SamplePrompt } from "@/lib/itinerary/sample-prompts";

export function SamplePromptGrid({
  onSelect,
  disabled,
}: {
  onSelect: (sample: SamplePrompt) => void;
  disabled: boolean;
}) {
  return (
    <div className="w-full space-y-3">
      <p
        className="animate-rise-in text-xs tracking-[0.15em] text-muted-foreground uppercase"
        style={{ animationDelay: "140ms" }}
      >
        Try asking
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SAMPLE_PROMPTS.map((sample, i) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => onSelect(sample)}
            disabled={disabled}
            className="animate-rise-in group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
            style={{ animationDelay: `${180 + i * 60}ms` }}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary transition-colors group-hover:bg-primary/15">
              <sample.icon className="size-4" strokeWidth={2} />
            </span>
            <span className="text-sm text-foreground">{sample.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
