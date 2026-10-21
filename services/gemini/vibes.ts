import "server-only";

import { z } from "zod";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { VibeExtractionOutputSchema, VibeExtractionResponseSchema } from "@/schemas/vibes";
import { GeminiClientError, getGeminiClient } from "@/services/gemini/client";
import type { VibeExtractionRequest, VibeExtractionResponse } from "@/schemas/vibes";

const VIBE_PROMPT = [
    "You are an uncompromising film-texture and cultural analyst helping a viewer dissect what kind of movie experience they want.",
    "Given only the movie title below, return 10 to 15 concise, distinct, granular vibe keywords or micro-genres.",
    "Gather a comprehensive mix of both basic/surface identifiers and deeper, visceral, or psychological keywords.",
    "CRITICAL: Do not shy away from mature, explicit, adult, R-rated, or NC-17 themes if the anchor movie warrants them (e.g., sex , intense eroticism, explicit nudity , raw youth angst, taboo obsession, visceral violence, existential dread, raw intimacy). Treat keywords like raw cinematic texture.",
    "Use a varied spread of atmosphere, emotion, micro_genre, trope, pacing, and visual_style.",
    "Prefer precise ideas such as 'rain-soaked gothic romance' or 'claustrophobic psychological tension' over broad labels such as 'drama'. Avoid duplicates and do not assume the user likes every trait of the anchor movie.",
    "Return movieTitle exactly as supplied. Do not return movie facts, prose, or explanations. Return only structured output matching the supplied schema.",
    "Movie title: ",
].join("\n");

type GeminiSchema = Parameters<ReturnType<typeof getGeminiClient>["generateStructured"]>[1];

function toGeminiSchema(value: unknown): GeminiSchema {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error("Vibe response schema must be an object.");
    }
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    const types: Record<string, string> = { string: "STRING", object: "OBJECT", array: "ARRAY" };
    if (typeof source.type === "string") target.type = types[source.type] ?? source.type;
    if (Array.isArray(source.required)) target.required = source.required;
    if (Array.isArray(source.enum)) target.enum = source.enum;
    if (typeof source.minLength === "number") target.minLength = String(source.minLength);
    if (typeof source.minItems === "number") target.minItems = String(source.minItems);
    if (typeof source.description === "string") target.description = source.description;
    if (typeof source.title === "string") target.title = source.title;
    if (typeof source.properties === "object" && source.properties !== null && !Array.isArray(source.properties)) {
        target.properties = Object.fromEntries(
            Object.entries(source.properties as Record<string, unknown>).map(([key, child]) => [key, toGeminiSchema(child)]),
        );
    }
    if (source.items !== undefined) target.items = toGeminiSchema(source.items);
    return target as GeminiSchema;
}

const outputSchema = toGeminiSchema(z.toJSONSchema(VibeExtractionOutputSchema));

export async function extractMovieVibes(request: VibeExtractionRequest): Promise<VibeExtractionResponse> {
    let generated: unknown;
    try {
        generated = await getGeminiClient().generateStructured(
            `${VIBE_PROMPT}\n${request.movieTitle}`,
            outputSchema,
            { temperature: 0.8, maxOutputTokens: 1200 }, // Slightly higher temperature (0.8) helps diversify deep/mature keywords
        );
    } catch (error) {
        if (error instanceof GeminiClientError) {
            const status = error.code === "RATE_LIMITED" ? 429 : 503;
            throw new AppError(
                error.code === "RATE_LIMITED" ? "RATE_LIMITED" : "AI_SERVICE_ERROR",
                "The vibe service is temporarily unavailable. Please try again.",
                status,
            );
        }
        throw error;
    }

    const parsed = VibeExtractionResponseSchema.safeParse(generated);
    if (!parsed.success) {
        logger.error("Gemini vibe output failed validation", {
            category: "INVALID_OUTPUT",
            issues: parsed.error.issues.map((issue) => ({ path: issue.path, code: issue.code })),
        });
        throw new AppError("AI_SERVICE_ERROR", "The vibe service could not produce a valid response.", 502);
    }
    return { ...parsed.data, movieTitle: request.movieTitle };
}