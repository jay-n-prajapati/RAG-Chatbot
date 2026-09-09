# Progress

## Status: Infra setup complete.

- [x] Requirements and architecture interviewed and decided (see `spec.md`,
      `decisions.md`).
- [x] Implementation plan drafted (see `plan.md`).
- [x] Docker Postgres+pgvector running and reachable (`docker-compose.yml`,
      port 5433 — see `decisions.md`).
- [x] Env vars set up (`.env.local`, `.env.example`).
- [x] Dependencies installed (`drizzle-orm`, `drizzle-kit`, `pg`,
      `@google/genai`, `zod`, shadcn/ui + its deps).
- [x] shadcn/ui installed and configured with base primitives (`button`,
      `input`, `label`, `card`).
- [x] Drizzle config + base schema + migration + pgvector HNSW index.
- [x] Dependency isolation module skeletons (`src/lib/ai/`, `src/lib/db/`).
- [x] Verified: dev server runs (port 3001, 3000 was taken by an unrelated
      local container), DB connects via the Drizzle client, lint/build pass.

**Blocking item for feature work:** `GEMINI_API_KEY` in `.env.local` is a
placeholder — the user must fill in a real key from
https://aistudio.google.com/apikey before any Gemini-dependent code
(`spec/itinerary-generator/`) can actually run.

This spec is done. Feature work moves to `spec/itinerary-generator/`.
