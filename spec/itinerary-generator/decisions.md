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

## Dataset scope

**Decision:** The curated dataset (`data/places.json`) covers **Indian
destinations only** — hill stations, beaches, desert, wildlife, spiritual,
and heritage/culture entries (23 places: Manali, Leh-Ladakh, Rishikesh,
Jaipur, Udaipur, Jaisalmer, Goa, Gokarna, Munnar, Alleppey, Varanasi, Agra,
Hampi, Coorg, Darjeeling, Shillong, Rann of Kutch, Ranthambore, Mysore,
Pondicherry, Spiti Valley, Dharamshala, Andaman Islands).
**Why:** Matches the earlier Manali/Himachali-thali example already in the
specs; keeps the hand-curated dataset coherent and realistic to write by
hand rather than a shallow global grab-bag.

## Dataset file format

**Decision:** `data/places.json` (plain JSON), not `.ts`.
**Why:** It's pure data, not code — JSON keeps it editable without a build
step and avoids tempting anyone to put logic in the data file. Validated
against `PlaceDataSchema` (Zod, `src/lib/itinerary/place-data.ts`) at read
time in both the ingestion endpoint, so a malformed entry fails loudly
rather than silently.

## UI location

**Decision:** The itinerary form replaces the default home page
(`src/app/page.tsx`) rather than living at a separate route.
**Why:** This is the only feature in the app right now; a dedicated route
would add navigation for no current benefit.

## Itinerary output schema

**Decision:** `{ place: string, days: number, experience: string, itinerary:
{ day: number, title: string, activities: string[], meals?: string[], tips?:
string }[] }` (see `src/lib/itinerary/schema.ts`, `ItinerarySchema`).
**Why:** Mirrors the form inputs plus one entry per day; `meals`/`tips` are
optional since not every day of every itinerary needs them, but `activities`
is always required as the core content of a day.

## Gemini structured-output approach

**Decision:** Use `responseMimeType: "application/json"` plus explicit JSON-
shape instructions in the prompt, not Gemini's `responseSchema`/
`responseFormat` config.
**Why:** The installed `@google/genai` version marks `responseSchema` as
deprecated in favor of `responseFormat`, and `responseSchema` expects the
SDK's own `Schema`/`Type` (`"OBJECT"`, `"STRING"`, uppercase) shape, not a
plain JSON Schema — translating a Zod schema into that shape adds real
complexity for no extra safety, since the actual safety net is the Zod
validation pass already decided above (see "Response validation"). Prompt
instructions + Zod validation is simpler and equally correct.

## Retrieval threshold & column types

**Decision:** `SIMILARITY_THRESHOLD = 0.7` and `TOP_K = 3` as named
constants in `src/app/api/generate-itinerary/route.ts` (not yet tuned
against real queries — blocked on `GEMINI_API_KEY`). `experience_tags` is a
Postgres `text[]` column (not a comma-joined string), defaulting to `{}`.
**Why:** Named constants make the threshold easy to find and tune later.
`text[]` is the natural fit for a list of tags and lets future filtering
(e.g. "only adventure places") use array operators instead of string
parsing.

## Ingestion strategy: full replace, not upsert

**Decision:** `POST /api/ingest` deletes all rows in `places` and
re-inserts the full dataset on every call, rather than upserting by name.
**Why:** The dataset is small (~23 rows) and the endpoint is already
unauthenticated/dev-only (see "Ingestion" above); a full replace is simpler
than tracking upsert keys and is safe to re-run any time the dataset file
changes.

## "No data" response shape

**Decision:** The "no data for this place" case returns HTTP 200 with
`{ status: "no_data", message }`, distinct from `{ status: "ok", itinerary
}` — not a 404 or other error status.
**Why:** It's an expected, valid outcome of a normal request (per the
strict-grounding decision above), not a client or server error — the
`status` field, not the HTTP status code, is what the frontend branches on.

## Migration not yet applied (environment blocker)

**Decision/note:** The schema migration for `experience_tags`/`raw_data`
(`drizzle/0001_nebulous_kang.sql`) was generated but could not be applied or
verified against the live database during this implementation pass, because
Docker Desktop's backend (the `desktop-linux` context) was unresponsive on
this machine — `docker ps`/`docker compose ps` hung and port 5433 refused
connections, while the dataset/schema/endpoint code itself was written and
type-checked successfully. This is an environment issue, unrelated to
`GEMINI_API_KEY` being unset. Once Docker Desktop is responsive again: `docker
compose up -d`, then apply the migration (`npx drizzle-kit migrate` or run
the SQL file directly), then re-run the ingestion/generation smoke tests.

**Resolved:** Docker Desktop recovered; the migration was applied and
verified live (`\d places` shows both columns). End-to-end (ingest + real
generation) now passes — see entries below.

## Gemini model names drift — real end-to-end fixes

**Decision/note:** Once a real `GEMINI_API_KEY` was set, three real bugs
surfaced that the placeholder-key testing couldn't catch, all now fixed:

1. **`text-embedding-004` is no longer available** to this key/API version
   (confirmed via a live `ListModels` call — only `gemini-embedding-001` and
   preview variants support `embedContent` now). Switched
   `GEMINI_EMBEDDING_MODEL` default to `gemini-embedding-001`, and pass
   `config: { outputDimensionality: EMBEDDING_DIMENSIONS }` (768) in both
   `/api/ingest` and `/api/generate-itinerary` so the output still matches
   the existing `vector(768)` column — no schema/migration change needed
   (verified: a live call with `outputDimensionality: 768` returns exactly
   768 values).
2. **`gemini-2.0-flash`, then `gemini-2.5-flash`, are also gone** — the API
   itself returned a `404` naming `gemini-3.6-flash` as the replacement;
   verified that model actually works for this key before adopting it as
   the new `GEMINI_GENERATION_MODEL` default.
3. **pgvector cosine-distance query bug**: drizzle-orm's `cosineDistance()`
   helper sends the query embedding as a bound text parameter, but
   Postgres's `<=>` operator only auto-resolves to `vector` for inline SQL
   literals, not bound parameters — this raised `42883: operator does not
   exist`. Fixed in `/api/generate-itinerary` by building the similarity
   expression by hand with an explicit `::vector` cast
   (`sql\`${JSON.stringify(queryEmbedding)}::vector\``) instead of using the
   helper.

**Why this belongs in decisions, not just a commit message:** all three are
exactly the kind of "worked when I checked it, broke against the real API"
gap that placeholder-key testing can't surface, and Google's model
deprecation cadence means the *specific* model names above should be
expected to go stale again — if `/api/ingest` or `/api/generate-itinerary`
starts returning `404` from Gemini, check `ListModels` for the key in use
before assuming it's a code bug.

**Verified:** `POST /api/ingest` against the real dataset (23/23 embedded),
then `POST /api/generate-itinerary` for `{"place":"Manali","days":3,
"experience":"adventure"}` returned a valid, schema-conforming 3-day
itinerary grounded in the real Manali dataset entry.

## Free-text query parsing (frontend)

**Decision:** The composer is a single free-text input (e.g. "provide me 3
day adventure itinerary at manali"), not separate place/days/experience
fields. `src/lib/itinerary/parse-query.ts` derives the structured
`{ place, days, experience }` client-side via lightweight heuristics — a
day-count regex, a substring match against the known dataset place names
(including parenthetical aliases like "Alleppey (Alappuzha)"), and a keyword
match against known experience tags — before calling the unchanged
`/api/generate-itinerary` contract.
**Why:** The user explicitly wants a real single-box chat input, matching
how Claude/ChatGPT/Gemini take a plain sentence rather than a form. A full
NLP/LLM-based parse was rejected as overkill for a small, curated dataset;
the heuristic parser doesn't need to be perfect — an unmatched or
mis-parsed place still round-trips through the backend's existing vector
retrieval, which already has a graceful "no data for this place" path for
exactly that case, so parsing failures degrade gracefully rather than
breaking. The parsed reading is shown under the user's chat bubble
("Understood: Manali · 3 days · adventure") for transparency, since the
parse is a heuristic guess the user can't otherwise see.
**Superseded:** An earlier pass had separate place/days-stepper/experience
fields plus quick-select experience chips; both were removed in favor of
the single free-text box per explicit user direction.

## Response card design

**Decision:** Each day of a generated itinerary renders as a "boarding
pass" — a ticket-stub layout (`BoardingPassDay` in `src/app/page.tsx`) with
a main stub (day number, title, activities checklist, meals/tips footer), a
perforated dashed tear-line with punched circular notches, and a small
"gate stub" repeating the day number plus a 3-letter destination code
(e.g. "Manali" → "MAN").
**Why:** User asked to be given distinct design options rather than one
default; presented four (Boarding Pass, Trail Map Timeline, Journal
Accordion, Postcard Grid) with text-mockup previews and the user picked
Boarding Pass — it's the most memorable/on-theme for a travel app. The
other three concepts aren't implemented; revisit this decision if the
boarding-pass metaphor stops fitting (e.g. very long trips where the
tear-line ticket format gets repetitive — the Journal Accordion option
would suit that case better).

## Theming values (globals.css only)

**Decision:** The warm "Yatra" travel-journal palette (espresso ground,
marigold primary, terracotta accent, peacock chart-3) is expressed purely
as *values* on shadcn's existing standard token names — `--background`,
`--primary`, `--accent`, etc. — in `src/app/globals.css`, with no new
custom variable names introduced (see `spec/initial-infra-setup/decisions.md`
— "Readability, scalability, and replaceability" / "UI component library").
`.dark` mirrors `:root` 1:1 since the app has no light/dark toggle — only
`:root` is actually live today, but keeping `.dark` in sync means nothing
regresses if a toggle is added later.
**Why:** User explicitly asked to keep variable names as-is and confine
theming changes to `globals.css` alone, after an earlier pass had
introduced bespoke variable names (`--marigold`, `--terracotta`, etc.)
that were reverted for the same reason. Additional atmosphere (a subtle
radial vignette on `body`, a marigold→terracotta gradient-text utility, a
gradient-hairline card border utility, a shimmer keyframe) was added as
new utility classes/keyframes, not new color variables — those are a
different concern from the semantic token set and don't conflict with the
"shadcn vars only" constraint.
