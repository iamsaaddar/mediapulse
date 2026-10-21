import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { VibeExtractionRequestSchema } from "@/schemas/vibes";
import { extractMovieVibes } from "@/services/gemini/vibes";

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Invalid request body." } }, { status: 400 });
	}
	const parsed = VibeExtractionRequestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Enter a movie title to continue." } }, { status: 400 });
	}
	try {
		return NextResponse.json(await extractMovieVibes(parsed.data));
	} catch (error) {
		if (error instanceof AppError) {
			return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
		}
		logger.error("Vibe extraction API request failed", { category: "INTERNAL_ERROR" });
		return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "The vibe service is temporarily unavailable." } }, { status: 500 });
	}
}
