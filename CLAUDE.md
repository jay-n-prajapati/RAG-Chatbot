# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository started as an unmodified `create-next-app` scaffold (Next.js 16, App Router, React 19, TypeScript, Tailwind CSS v4). Foundational infra (Postgres+pgvector, Drizzle, Gemini SDK, shadcn/ui, `src/lib/` isolation module skeletons — no feature endpoints or logic) is being set up first — see `spec/initial-infra-setup/` — followed by the first real feature, an AI itinerary generator (place/days/experience → RAG-grounded itinerary) — see `spec/itinerary-generator/`. Infra must be fully done (`spec/initial-infra-setup/progress.md` checked off) before feature work starts.

## Spec-driven feature workflow

Every feature (and the initial infra setup itself) lives under `spec/<feature-name>/` with four files, written *before* implementation starts and kept up to date as work progresses:

- `spec.md` — what the feature does: inputs, behavior, explicit out-of-scope items.
- `decisions.md` — each non-obvious design decision plus its rationale (why, not just what), so a later session can judge whether the reasoning still holds instead of re-deriving it or accidentally reversing it.
- `plan.md` — ordered implementation steps/checklist.
- `progress.md` — current status; check this first to see how far along a feature is without digging through git history.

When starting new feature work: check whether `spec/<feature-name>/` already exists and read it first. When making a non-obvious architectural or technical choice, record it in that feature's `decisions.md` as you go, not just in conversation. When a plan step completes, check it off in `progress.md`.

## Code design principle: readability, scalability, replaceability

Code in this repo should be organized so it stays easy to read and cheap to adapt as requirements change. In practice: isolate each external dependency (LLM provider, database, etc.) behind a thin module (e.g. `src/lib/ai/`, `src/lib/db/`) that the rest of the app depends on, instead of calling third-party SDKs directly from route handlers or components — so swapping a provider or store later touches one module, not scattered call sites. This is about isolating dependencies for low-friction replacement, not pre-building speculative provider-agnostic abstraction layers ahead of actual need — see `spec/initial-infra-setup/decisions.md` for where that line was drawn.

## Commands

- `npm run dev` — start the dev server (Next.js with Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`)

There is no test runner configured yet.

## Architecture

- App Router structure under `src/app/`, with the `@/*` path alias mapped to `src/*` (see `tsconfig.json`).
- Styling is Tailwind CSS v4, configured via `@tailwindcss/postcss` in `postcss.config.mjs` and imported in `src/app/globals.css` (no `tailwind.config.*` file — v4 uses CSS-based configuration).
- ESLint uses the new flat-config format (`eslint.config.mjs`), extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
- TypeScript is strict (`strict: true` in `tsconfig.json`).

## Planned stack (see `spec/initial-infra-setup/decisions.md` for full rationale)

- **LLM/embeddings:** Google Gemini, called directly via `@google/genai` (`text-embedding-004` for embeddings, `gemini-2.0-flash` for generation) — chosen for its no-credit-card free tier.
- **Vector DB:** PostgreSQL + `pgvector`, run locally via Docker — not MongoDB (Atlas Vector Search is cloud-only; local Mongo has no native vector search), chosen for SQL-visible similarity queries.
- **DB access:** Drizzle ORM.
- **UI components:** shadcn/ui on top of Tailwind CSS v4.
- **Validation:** Zod, used to validate LLM JSON output before it reaches the client.

Update this section once the corresponding infra actually lands (don't leave it describing a plan that's already been superseded by real code).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
