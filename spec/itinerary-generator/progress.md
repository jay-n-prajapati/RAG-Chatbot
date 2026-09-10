# Progress

## Status: End-to-end verified against the real Gemini API. UI redesigned as a chat interface.

- [x] Requirements and behavior interviewed and decided (see `spec.md`,
      `decisions.md`).
- [x] Implementation plan drafted (see `plan.md`).
- [x] Infra setup complete (tracked in `spec/initial-infra-setup/progress.md`).
- [x] `places` schema extended with `experience_tags` (text[]) and
      `raw_data` (jsonb). Migration applied and verified live.
- [x] Curated dataset written (`data/places.json`, 23 Indian destinations).
- [x] Ingestion endpoint (`POST /api/ingest`) — live-verified against the
      real Gemini API: all 23 places embedded and stored successfully.
- [x] Generation endpoint (`POST /api/generate-itinerary`) — live-verified
      end-to-end: real retrieval + real Gemini generation returns a valid,
      schema-conforming itinerary for a place in the dataset.
- [x] Frontend redesigned as a chat-style interface (`src/app/page.tsx`):
      single free-text composer (parsed client-side via
      `src/lib/itinerary/parse-query.ts`), clickable sample prompts,
      scrolling turn transcript, loading/no-data/error/success states.
      Verified live in the browser via curl-rendered HTML and direct API
      calls (no interactive browser tool available this session — say so
      explicitly rather than claiming a visual check).
- [x] End-to-end verified: ingest real data, generate a real itinerary for
      a place in the dataset (Manali/adventure/3 days — succeeded with a
      valid, schema-conforming response), and the "no data" path for a
      place NOT in the dataset (Paris/romantic/3 days — correctly returned
      `{"status":"no_data", ...}`).

## Notes for next session

- Three real bugs were found and fixed only once a real `GEMINI_API_KEY`
  was set — Gemini model name drift (`text-embedding-004` →
  `gemini-embedding-001`, `gemini-2.0-flash` → `gemini-3.6-flash`) and a
  pgvector query parameter cast bug. See `decisions.md` ("Gemini model
  names drift — real end-to-end fixes"). If either endpoint starts
  returning Gemini `404`s again, check `ListModels` for the key in use
  before assuming a code regression.
- The dev server was left running on port 3000 for interactive use.
