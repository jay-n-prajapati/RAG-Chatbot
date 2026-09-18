# RAG Chatbot — AI Itinerary Generator

A Retrieval-Augmented Generation (RAG) app that turns a destination, a number
of days, and a desired experience/vibe into a structured, day-by-day travel
itinerary — grounded in a curated place dataset rather than an LLM's general
knowledge.

## How it works

1. The user submits `place` (free text), `days`, and `experience` (e.g.
   "adventure", "relaxing").
2. `place + experience` is embedded and used to vector-search a curated
   place dataset stored in Postgres (`pgvector`) for the top-3 nearest
   matches by cosine similarity.
3. If the best match's similarity is below a threshold, the app refuses and
   tells the user the destination isn't supported yet — no LLM
   general-knowledge fallback (strict grounding).
4. Otherwise, the retrieved place data + `days` + `experience` are passed to
   Gemini, which generates a structured itinerary as JSON.
5. The JSON is validated against a Zod schema before being returned to the
   client and rendered as a "boarding pass" style itinerary.

The response is not streamed: the UI shows a loading state, then renders the
full itinerary at once.

See `spec/itinerary-generator/` for the full spec, design decisions, and
implementation plan.

## Tech stack

| Concern              | Choice                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Framework            | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript (strict)                                                   |
| Styling / UI         | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com)                                                                            |
| **LLM SDK**          | [`@google/genai`](https://www.npmjs.com/package/@google/genai) — Google Gemini, called directly (no LangChain/agent framework) |
| **Embeddings model** | Gemini `gemini-embedding-001`                                                                                                  |
| **Generation model** | Gemini `gemini-3.6-flash`                                                                                                      |
| Vector database      | PostgreSQL + [`pgvector`](https://github.com/pgvector/pgvector), run locally via Docker                                        |
| ORM / DB access      | [Drizzle ORM](https://orm.drizzle.team)                                                                                        |
| Output validation    | [Zod](https://zod.dev) — validates LLM JSON output before it reaches the client                                                |

Gemini was chosen for its no-credit-card free tier; Postgres+pgvector was
chosen over a managed vector store (e.g. Mongo Atlas Vector Search) so
similarity queries stay SQL-visible and can run fully locally via Docker. See
`spec/initial-infra-setup/decisions.md` for the full rationale behind each
choice.

### Dependency isolation

Third-party dependencies are isolated behind thin wrapper modules so a
provider/store swap touches one place, not scattered call sites:

- `src/lib/ai/` — the shared Gemini client (`GoogleGenAI`) plus the
  embedding/generation model names. All LLM and embedding calls in the app
  go through this module.
- `src/lib/db/` — Drizzle client and schema. All database access goes
  through this module.

## Project structure

```
src/
  app/
    api/
      generate-itinerary/   # POST: embed query → vector search → Gemini → validate → respond
      ingest/                # POST: ingest curated place data + embeddings (dev-only, no auth yet)
    page.tsx                 # Chat-style itinerary UI
  components/
    itinerary/                # Composer, turn view, boarding-pass day cards, sample prompts
    ui/                        # shadcn/ui primitives
  lib/
    ai/                        # Gemini client isolation module
    db/                         # Drizzle client + schema
    itinerary/                  # Query parsing, embedding text, place data, Zod schema, turn types
```

## Getting started

### Prerequisites

- Node.js
- Docker (for the local Postgres + pgvector instance)
- A [Gemini API key](https://aistudio.google.com/apikey) (free tier, no
  billing required)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Gemini API key:

   ```bash
   cp .env.example .env.local
   ```

3. Start Postgres (with pgvector) via Docker Compose:

   ```bash
   docker compose up -d
   ```

4. Push the Drizzle schema to the database:

   ```bash
   npx drizzle-kit push
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

6. Ingest the curated place dataset (dev-only endpoint, no auth) so the
   itinerary generator has data to retrieve against — see
   `src/app/api/ingest/route.ts`.

### Environment variables

See `.env.example`:

- `DATABASE_URL` — Postgres connection string (matches `docker-compose.yml`).
- `GEMINI_API_KEY` — your Gemini API key.
- `GEMINI_EMBEDDING_MODEL` — defaults to `gemini-embedding-001`.
- `GEMINI_GENERATION_MODEL` — defaults to `gemini-3.6-flash`.

## Commands

- `npm run dev` — start the dev server (Next.js with Turbopack) at
  http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint
