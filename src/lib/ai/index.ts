import { GoogleGenAI } from "@google/genai";

/**
 * Single shared Gemini client. Every LLM/embedding call in the app should
 * import `ai` from here rather than constructing its own client — this is
 * the isolation point for swapping the provider later.
 */
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
export const GENERATION_MODEL =
  process.env.GEMINI_GENERATION_MODEL ?? "gemini-3.6-flash";
