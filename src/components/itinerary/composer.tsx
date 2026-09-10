import { Button } from "@/components/ui/button";
import { LoaderCircle, Send } from "lucide-react";

export function Composer({
  query,
  setQuery,
  onSubmit,
  disabled,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-black/20"
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask for a trip… e.g. “3 day adventure trip to Manali”"
        disabled={disabled}
        aria-label="Describe the trip you want"
        className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !query.trim()}
        className="size-9 shrink-0 rounded-xl"
        aria-label="Generate itinerary"
      >
        {disabled ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
