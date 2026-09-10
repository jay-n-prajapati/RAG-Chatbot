import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db, schema } from "@/lib/db";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";
import { ai, EMBEDDING_MODEL } from "@/lib/ai";
import { PlaceDataArraySchema } from "@/lib/itinerary/place-data";
import { buildPlaceEmbeddingText } from "@/lib/itinerary/embedding-text";

/**
 * Dev-only ingestion endpoint: reads data/places.json, embeds each place
 * with Gemini, and replaces the `places` table contents. No auth — see
 * spec/itinerary-generator/decisions.md ("Ingestion") for why that's an
 * intentional, temporary gap.
 */
export async function POST() {
  let places;
  try {
    const raw = await readFile(
      path.join(process.cwd(), "data", "places.json"),
      "utf-8",
    );
    places = PlaceDataArraySchema.parse(JSON.parse(raw));
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to read/validate data/places.json: ${(error as Error).message}` },
      { status: 500 },
    );
  }

  const rows: (typeof schema.places.$inferInsert)[] = [];

  for (const place of places) {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: buildPlaceEmbeddingText(place),
        config: { outputDimensionality: EMBEDDING_DIMENSIONS },
      });
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) {
        throw new Error("Gemini returned no embedding values");
      }
      rows.push({
        name: place.place,
        embedding,
        experienceTags: place.experienceTags,
        rawData: place,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: `Failed to embed "${place.place}": ${(error as Error).message}`,
        },
        { status: 502 },
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(schema.places);
    await tx.insert(schema.places).values(rows);
  });

  return NextResponse.json({ ingested: rows.length });
}
