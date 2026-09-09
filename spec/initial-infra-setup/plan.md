# Implementation Plan

Scope: get the app running with everything installed and wired up. No
feature logic — see `spec/itinerary-generator/plan.md` for what comes next.

## 1. Database

- [ ] `docker-compose.yml`: Postgres with `pgvector` extension (e.g.
      `pgvector/pgvector` image), persistent volume, exposed port.
- [ ] Confirm the container starts and is reachable (`psql` or equivalent).

## 2. Env vars

- [ ] `.env.local` (gitignored) + `.env.example`: `DATABASE_URL`,
      `GEMINI_API_KEY`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_GENERATION_MODEL`.

## 3. Dependencies

- [ ] Install: `drizzle-orm`, `drizzle-kit`, `pg`, `@google/genai`, `zod`.
- [ ] Install and initialize shadcn/ui (`npx shadcn@latest init`) on top of
      the existing Tailwind v4 setup; add a small set of base primitives
      (e.g. `button`, `input`, `label`, `card`) to prove it's wired up.

## 4. Drizzle base schema

- [ ] Drizzle config + connection client.
- [ ] A minimal `places` table (id, name, `embedding vector(768)` — 768 =
      `text-embedding-004` dimension) just to prove the schema/migration/
      pgvector-index pipeline works end to end. Full column shape for real
      data is decided in `spec/itinerary-generator/plan.md`.
- [ ] Migration + pgvector index (e.g. HNSW or IVFFlat via Drizzle raw SQL,
      since Drizzle's pgvector support may need a manual index statement).

## 5. Dependency isolation module skeletons

- [ ] `src/lib/db/`: Drizzle client + schema exports — no query logic yet.
- [ ] `src/lib/ai/`: Gemini client wiring (reads `GEMINI_API_KEY`, exports a
      configured client) — no embedding/generation calls yet.

## 6. Verify

- [ ] `npm run dev` runs cleanly.
- [ ] App can connect to Postgres via the Drizzle client at startup/request
      time (a trivial query, not feature logic).
- [ ] `npm run lint` and `npm run build` pass with the new dependencies in
      place.
