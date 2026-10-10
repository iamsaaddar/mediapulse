import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { RecommendationRequestSchema, RecommendationResponseSchema } from "@/schemas/recommendations";
import { generateRecommendationResponse } from "@/services/recommendations/orchestrator";

function errorResponse(code: string, message: string, status: number) {
	return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return errorResponse("INVALID_REQUEST", "Invalid request body.", 400);
	}

	const validation = RecommendationRequestSchema.safeParse(body);
	if (!validation.success) {
		return errorResponse("INVALID_REQUEST", "Invalid recommendation request.", 400);
	}

	try {
		const response = await generateRecommendationResponse(validation.data);
		const checked = RecommendationResponseSchema.safeParse(response);
		if (!checked.success) {
			throw new AppError(
				"AI_SERVICE_ERROR",
				"The recommendation service returned an invalid final response.",
				502,
			);
		}
		return NextResponse.json(checked.data, { status: 200 });
	} catch (error) {
		if (error instanceof AppError) {
			return errorResponse(error.code, error.message, error.statusCode);
		}

		logger.error("Recommendation API request failed", {
			category: "INTERNAL_ERROR",
			cause: error instanceof Error ? error.message : String(error),
		});
		return errorResponse(
			"INTERNAL_ERROR",
			"The recommendation service is temporarily unavailable.",
			500,
		);
	}
}
