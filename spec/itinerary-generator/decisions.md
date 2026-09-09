# Decisions

Recorded from the design interview before implementation started. Each entry
is a decision + why, so later sessions can judge whether it still holds
rather than re-litigating from scratch.

Scope note: this file covers feature-behavior decisions for the itinerary
generator (data, chunking, retrieval, ingestion, output, interaction model).
Infra-level decisions (DB choice, ORM, LLM SDK, UI library, code
organization) are recorded in `spec/initial-infra-setup/decisions.md`.

## Grounding data

**Decision:** Small curated dataset (~20-50 places) as JSON/MD/TS, one file
checked into the repo (not scraped, not from a live API).
**Why:** User is new to RAG; a hand-curated dataset removes scraping/API
complexity so the focus stays on the embed → retrieve → generate pipeline.

## Chunking

**Decision:** One chunk per place — the entire place entry (attractions,
activities, food, tips) is embedded as a single vector, not split by section.
**Why:** At ~20-50 short entries, per-section chunking would require
regrouping fragments back by place after retrieval, for no real precision
gain. Revisit if the dataset grows large or entries get long (multi-paragraph).

## Ingestion

**Decision:** A dedicated API endpoint (e.g. `POST /api/ingest`) reads the
place dataset file, generates embeddings via Gemini, and upserts rows into
Postgres. **No auth protection for now** — it's only called manually during
development.
**Why:** User explicitly wants an endpoint (not a CLI script). Protection is
explicitly deferred, not forgotten: must be added (e.g. shared-secret header)
before this is ever reachable from a public deployment.

## Interaction model

**Decision:** One-shot form (place, days, experience) for the MVP.
Conversation/multi-turn history is out of scope now but is a known future
requirement.
**Why:** Matches the described use case exactly; multi-turn chat would add
conversation-state complexity before the core RAG loop even works once. The
user explicitly flagged history as future scope — keep schemas/APIs from
painting into a corner that makes adding it later hard (e.g. don't assume
exactly one itinerary per request with no way to associate a session/user).

## Output format & streaming

**Decision:** Structured JSON (day-by-day), validated server-side with Zod
before being returned to the client. **No streaming** — the client waits
(with a loading state) for the full validated response.
**Why:** Streaming + structured JSON are normally in tension (a client can't
parse incomplete JSON). The Vercel AI SDK's `streamObject` (partial-object
streaming) was offered as a way to get both, but the user opted to call the
Gemini SDK directly and drop the streaming requirement instead, for
simplicity. This was explicitly re-confirmed after flagging the tradeoff.

## Retrieval

**Decision:** Embed `place + experience` text together (not place alone) as
the query. Vector-search for top-3 nearest place entries by cosine
similarity. If the best match's similarity is below a threshold (start
~0.7, tunable after real testing), refuse with a "no data for this place"
message rather than falling back to the LLM's general knowledge.
**Why:** Combining place+experience matches how the dataset entries are
tagged (place + vibe), improving retrieval relevance over place-name-only
matching. Strict grounding (refuse on no match) was chosen over general-
knowledge fallback because the user wants a genuinely RAG-grounded app, not
one that silently reverts to ungrounded generation.
**Note:** Place input is free text specifically because an exact
dropdown/autocomplete selection would make vector search largely redundant
(you'd just do a direct lookup by name) — free text is what makes retrieval
actually necessary.

## Response validation

**Decision:** Validate Gemini's JSON output against a Zod schema before
returning it to the frontend; return a clear error on validation failure
rather than passing through unvalidated/malformed data.
**Why:** Gemini's JSON mode is usually reliable but not guaranteed-valid;
failing loudly server-side beats letting broken data reach the UI.
