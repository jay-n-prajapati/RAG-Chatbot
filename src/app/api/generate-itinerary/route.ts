import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";
import { ai, EMBEDDING_MODEL, GENERATION_MODEL } from "@/lib/ai";
import { buildQueryEmbeddingText } from "@/lib/itinerary/embedding-text";
import { ItinerarySchema } from "@/lib/itinerary/schema";
import { PlaceDataSchema } from "@/lib/itinerary/place-data";

/**
 * Below this cosine similarity, the best match is considered "no data for
 * this place" rather than a real grounding candidate — see
 * spec/itinerary-generator/decisions.md ("Retrieval"). Tune after real
 * testing once GEMINI_API_KEY is set.
 */
const SIMILARITY_THRESHOLD = 0.7;
const TOP_K = 3;

const RequestSchema = z.object({
  place: z.string().min(1),
  days: z.number().int().positive().max(30),
  experience: z.string().min(1),
});

export async function POST(request: Request) {
  const parsedBody = RequestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }
  const { place, days, experience } = parsedBody.data;

  let queryEmbedding: number[];
  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: buildQueryEmbeddingText(place, experience),
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const values = response.embeddings?.[0]?.values;
    if (!values) throw new Error("Gemini returned no embedding values");
    queryEmbedding = values;
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to embed query: ${(error as Error).message}` },
      { status: 502 },
    );
  }

  /**
   * drizzle-orm's cosineDistance() sends the query vector as a bound text
   * parameter; Postgres only resolves the `<=>` operator against an
   * explicit `vector` type for bound params (it works for inline literals,
   * not parameters), so we cast it ourselves here. See
   * spec/itinerary-generator/decisions.md ("pgvector query parameter cast").
   */
  const embeddingParam = sql`${JSON.stringify(queryEmbedding)}::vector`;
  const similarity = sql<number>`1 - (${schema.places.embedding} <=> ${embeddingParam})`;
  const matches = await db
    .select({ rawData: schema.places.rawData, similarity })
    .from(schema.places)
    .orderBy(desc(similarity))
    .limit(TOP_K);

  const best = matches[0];
  if (!best || best.similarity < SIMILARITY_THRESHOLD) {
    return NextResponse.json(
      {
        status: "no_data",
        message: `No curated data for "${place}" yet — try a different destination.`,
      },
      { status: 200 },
    );
  }

  const retrievedPlaces = matches
    .filter((m) => m.similarity >= SIMILARITY_THRESHOLD)
    .map((m) => PlaceDataSchema.parse(m.rawData));

  const prompt = buildItineraryPrompt({ retrievedPlaces, place, days, experience });

  let responseText: string;
  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    if (!response.text) throw new Error("Gemini returned an empty response");
    responseText = response.text;
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate itinerary: ${(error as Error).message}` },
      { status: 502 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    return NextResponse.json(
      { error: "Gemini returned malformed JSON" },
      { status: 500 },
    );
  }

  const validated = ItinerarySchema.safeParse(parsedJson);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "Gemini's response didn't match the expected itinerary shape",
        details: validated.error.flatten(),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "ok", itinerary: validated.data });
}

function buildItineraryPrompt({
  retrievedPlaces,
  place,
  days,
  experience,
}: {
  retrievedPlaces: z.infer<typeof PlaceDataSchema>[];
  place: string;
  days: number;
  experience: string;
}): string {
  return `You are a travel itinerary planner. Using ONLY the destination data
below (do not invent attractions, activities, or facts not present here),
create a ${days}-day itinerary for a trip to "${place}" with a "${experience}"
experience.

Destination data (JSON):
${JSON.stringify(retrievedPlaces, null, 2)}

Respond with JSON matching exactly this shape, with no extra commentary:
{
  "place": string,
  "days": number,
  "experience": string,
  "itinerary": [
    { "day": number, "title": string, "activities": string[], "meals"?: string[], "tips"?: string }
  ]
}
The itinerary array must have exactly ${days} entries, one per day, days numbered 1 to ${days}.`;
}
