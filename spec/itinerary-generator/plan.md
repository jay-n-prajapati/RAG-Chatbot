# Implementation Plan

Depends on `spec/initial-infra-setup/` being done first (app running,
Postgres+pgvector up, Drizzle base schema, shadcn/ui, `src/lib/ai/` +
`src/lib/db/` skeletons in place).

## 1. Data layer (extends the infra base schema)

- [ ] Extend the `places` table: `experience_tags`, `raw_data` (jsonb, the
      full curated entry) alongside the base `id`, `name`, `embedding`
      columns from infra setup. Keep it open to adding a `requests`/
      `history` table later without reshaping `places`.

## 2. Dataset

- [ ] `data/places.(json|ts)`: ~20-50 curated entries, one chunk-per-place
      shape (place, experience tags, bestDuration, attractions, activities,
      food, tips) as sketched in `spec.md`.

## 3. Ingestion endpoint

- [ ] `POST /api/ingest`: reads the dataset file, builds the embeddable text
      per place (whole entry), calls Gemini `text-embedding-004` (via
      `src/lib/ai/`), upserts into `places` (via `src/lib/db/`). No auth
      (documented as a known gap, see `decisions.md`).

## 4. Generation endpoint

- [ ] `POST /api/generate-itinerary`: accepts `{ place, days, experience }`.
  - Embed `place + experience` via Gemini.
  - pgvector top-3 cosine similarity search.
  - If best score < threshold (start at ~0.7): return a "no data for this
    place" response (not a 500 — a clear, expected app state).
  - Else: build a prompt with the retrieved place(s) + `days` + `experience`,
    call `gemini-2.0-flash` in JSON mode.
  - Validate the response against a Zod itinerary schema; on failure, return
    a clear server error (don't forward malformed JSON).

## 5. Frontend

- [ ] Form (shadcn primitives): free-text place input, days (number),
      experience (text or preset options).
- [ ] Loading state while awaiting the non-streamed response.
- [ ] Render the structured itinerary (day-by-day) once received.
- [ ] Render the "no data for this place" state distinctly from a real error.

## 6. End-to-end check

- [ ] Run ingest, then generate an itinerary for a place that IS in the
      dataset (should succeed) and one that ISN'T (should refuse cleanly).

## Deferred (explicitly out of scope for this pass)

- Conversation history / multi-turn refinement.
- Auth on `/api/ingest`.
- Streaming responses.
- Moving off local Docker Postgres to a hosted DB.
