# Decisions

Recorded from the design interview before implementation started. Each entry
is a decision + why, so later sessions can judge whether it still holds
rather than re-litigating from scratch.

Scope note: this file covers infra-level decisions only — which DB, which
ORM, which LLM SDK, which UI library, and how code should be organized.
Feature-behavior decisions (chunking, retrieval, grounding, ingestion,
output format, streaming, interaction model) are recorded in
`spec/itinerary-generator/decisions.md`.

## Database

**Decision:** PostgreSQL + `pgvector`, run locally via Docker (plain Postgres
container, not `mongodb-atlas-local`, not hosted Neon/Supabase, not MongoDB
Atlas).
**Why:** User originally proposed MongoDB, but MongoDB's vector search is an
Atlas-only feature (or the newer, less battle-tested `mongodb-atlas-local`
Docker image for local dev). Postgres+pgvector gives SQL-visible similarity
queries (`ORDER BY embedding <=> query`), which is easier to debug when
learning RAG mechanics for the first time, and one DB serves both vector and
future relational data (e.g. request history). Local Docker was chosen over
a hosted free tier (Neon/Supabase) for full control during development.

## DB access layer

**Decision:** Drizzle ORM (not raw `pg` + SQL, not Prisma).
**Why:** Prisma's pgvector support is a rougher preview-level feature. Raw
SQL was offered as the most "transparent for learning" option, but the user
preferred Drizzle's type safety with native pgvector column support.

## LLM provider & SDK

**Decision:** Google Gemini, called directly via `@google/genai` (not
through the Vercel AI SDK). Embeddings: `text-embedding-004`. Generation:
`gemini-2.0-flash`.
**Why:** Gemini has a genuine no-credit-card free tier (unlike OpenAI, which
requires billing setup even for trial credit). The Vercel AI SDK's
`streamObject` was considered as a way to get both streaming and structured
JSON output, but the user chose to drop the streaming requirement instead
and call the Gemini SDK directly, for a simpler dependency tree — see
`spec/itinerary-generator/decisions.md` ("Output format & streaming").

## UI component library

**Decision:** Install and configure shadcn/ui as part of initial infra setup,
on top of the existing Tailwind CSS v4 setup, rather than adding it later
per-feature or hand-rolling components.
**Why:** Every feature's UI (starting with the itinerary form/results)
should be built from a consistent, accessible component set from the start
rather than retrofitted; doing it during infra setup avoids inconsistent
ad-hoc styling across early features.

## Readability, scalability, and replaceability

**Decision:** Structure infra code so each external dependency (Gemini, the
DB) is isolated behind a thin module in `src/lib/` that the rest of the app
depends on, rather than calling third-party SDKs directly from route
handlers/components. Favor small, single-purpose, readable modules over
speculative abstraction layers.
**Why:** User wants the codebase to stay easy to read and to adapt (swap a
provider, replace a component, restructure a feature) as requirements
evolve. This is explicitly about *isolating* dependencies for low-friction
future replacement, not about pre-building provider-agnostic interfaces —
that would contradict the decision above to call the Gemini SDK directly
instead of adding the Vercel AI SDK abstraction layer. Isolation (one place
to change) and abstraction (an interface built before it's needed) are
different things; this decision asks for the former, not the latter.

## Postgres port

**Decision:** The Docker Compose Postgres container maps to host port
**5433**, not the default 5432.
**Why:** Port 5432 was already bound locally by an unrelated project's
Postgres container. `DATABASE_URL` in `.env.local`/`.env.example` reflects
5433 — check for a free port before assuming 5432 in future setup docs.

## Drizzle pgvector column & index

**Decision:** Use drizzle-orm's native `vector()` column type (available in
the installed `drizzle-orm@0.45.2`, from `drizzle-orm/pg-core`) for the
`embedding` column, rather than a `customType`. The pgvector extension
(`CREATE EXTENSION IF NOT EXISTS vector`) and the HNSW index
(`USING hnsw (embedding vector_cosine_ops)`) were added by hand-editing the
generated migration SQL, since `drizzle-kit generate` does not create
extensions or vector indexes on its own.
**Why:** Native column support existed, so no custom type or raw-SQL column
definition was needed. The extension/index statements are one-time DDL that
Drizzle's schema-diffing doesn't model — editing the migration file directly
(before it's applied) is the standard approach for this gap.

## shadcn/ui init specifics

**Decision:** Initialized with `npx shadcn@latest init -d` (defaults:
`next` template, `base-nova` preset, `neutral` base color, CSS variables
enabled), then added `button`, `input`, `label`, `card` via
`npx shadcn@latest add`.
**Why:** `-d/--defaults` gives a reasonable, unopinionated starting point
matching the existing Next.js App Router + Tailwind v4 setup without extra
prompts; component choices match `plan.md`'s named primitives exactly.

## Project structure convention

**Decision:** All new features get a `spec/<feature>/` folder with
`spec.md`, `decisions.md`, `plan.md`, and `progress.md`, and infra setup that
isn't specific to one feature gets its own such folder too (this one,
`spec/initial-infra-setup/`) rather than being folded into a feature's spec.
This is a repo-wide convention going forward.
**Why:** User explicitly requested this so design decisions and rationale
persist across sessions instead of living only in chat history, and so
infra concerns stay cleanly separated from feature behavior.
