# Feature: AI Itinerary Generator (RAG)

> Builds on the infra set up in `spec/initial-infra-setup/` (Postgres+pgvector,
> Drizzle, Gemini SDK, Zod, shadcn/ui). This feature cannot start until that
> spec's `progress.md` is fully checked off.

## Summary

A single-shot form where a user provides a destination (free text), number of
days, and desired experience/vibe (e.g. "adventure", "relaxing"). The app
retrieves relevant curated place data via vector search and uses an LLM to
generate a structured, day-by-day itinerary grounded in that data.

## Inputs

- `place`: free text (not a dropdown) — this is what makes retrieval
  meaningful; a typo or unlisted place is expected and must be handled.
- `days`: number — shapes itinerary length, passed directly into the
  generation prompt (not embedded/retrieved on).
- `experience`: free text/tag (e.g. "adventure", "relaxing", "food") —
  combined with `place` for the retrieval query embedding.

## Behavior

1. Embed `place + experience` as the retrieval query.
2. Vector-search the curated place dataset (pgvector) for the top-3 nearest
   entries by cosine similarity.
3. If the best match's similarity is below a threshold, refuse: tell the user
   this destination isn't supported yet (strict grounding — no LLM
   general-knowledge fallback).
4. Otherwise, pass the retrieved place data + `days` + `experience` to Gemini
   to generate a structured itinerary as JSON.
5. Validate the LLM's JSON output against a Zod schema before returning it to
   the client. Return a clear error if validation fails.
6. Response is NOT streamed — the UI shows a loading state, then renders the
   full structured itinerary at once.

## Out of scope (for now, explicitly deferred)

- Conversation/multi-turn chat (e.g. "make day 2 more relaxed"). The one-shot
  form is the MVP interaction model, but request/response history should be
  kept in mind when designing the DB schema and API so it isn't painful to
  add later.
- Auth on the ingest endpoint (dev-only for now; must be protected before any
  public deploy).
- Real-time streaming of the itinerary.
- Large-scale or live-fetched place data (curated static dataset only).

See `decisions.md` for the reasoning behind each choice, `plan.md` for the
implementation plan, and `progress.md` for current status.
