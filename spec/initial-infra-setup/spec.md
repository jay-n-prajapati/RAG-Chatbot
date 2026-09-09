# Initial Infra Setup

## Summary

Get the app running with all foundational dependencies installed and wired
up, and the basic folder structure in place — nothing feature-specific.
"Done" for this spec means: the dev server runs, Postgres+pgvector is up and
reachable, Drizzle is configured with a base schema, shadcn/ui is installed,
and dependency-isolation module skeletons exist. Actual feature logic
(ingestion endpoint, generation endpoint, retrieval, prompts, UI form) is
**not** part of this spec — see `spec/itinerary-generator/`.

## Scope

- **Database:** PostgreSQL + `pgvector` extension, running locally via
  Docker Compose, reachable from the app.
- **DB access:** Drizzle ORM — config, connection client, and a base schema
  (tables/columns exist and migrate cleanly; no query/business logic).
- **LLM/embeddings SDK:** `@google/genai` installed and configured with an
  API key (Gemini) — client wiring only, no embedding/generation calls yet.
- **Validation:** `zod` installed, available for use by features.
- **UI components:** shadcn/ui installed and initialized on top of the
  existing Tailwind CSS v4 setup, with a small set of base primitives added.
- **Env vars:** `.env.local` (gitignored) + `.env.example` documenting the
  required variables.
- **Folder structure:** basic `src/lib/` layout with isolation module
  skeletons (see design principle below) — empty/minimal clients, not
  feature code.

## Explicitly out of scope (belongs to feature specs, e.g. `itinerary-generator`)

- Any API route beyond what's needed to prove the app runs (no
  `/api/ingest`, no `/api/generate-itinerary`).
- The curated place dataset.
- Retrieval, chunking, grounding, prompt-building, or response-validation
  logic.
- Any UI screen/form beyond the default scaffold page.

## Design principle: readability, scalability, and easy replaceability

Every piece of this infra should be organized so that a future swap (e.g.
Gemini → another provider, Postgres → another store, one shadcn component →
a custom one) touches one well-defined module, not code scattered across the
app. Concretely:

- Isolate each external dependency behind a thin module in `src/lib/` (e.g.
  `src/lib/ai/` for the Gemini client, `src/lib/db/` for the Drizzle client)
  — callers depend on that module's interface, not on the third-party SDK
  directly.
- Keep modules small and single-purpose; prefer explicit, readable code over
  clever abstraction. This is about *isolating* dependencies for easy
  replacement, not building speculative provider-swapping abstractions ahead
  of need (see `decisions.md`).
- Database access goes through Drizzle schema/client modules, never raw
  queries inlined in route handlers.
- UI stays composed from shadcn primitives rather than one-off custom
  components, so the design system stays consistent and swappable.

See `decisions.md` for the reasoning behind each choice, `plan.md` for the
implementation plan, and `progress.md` for current status. Feature-level
behavior and decisions (RAG retrieval, chunking, ingestion, generation,
interaction model, output format) live in `spec/itinerary-generator/`.
