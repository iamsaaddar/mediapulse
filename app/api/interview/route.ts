import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { InterviewRequestSchema } from "@/schemas/interview";
import { runInterview } from "@/services/gemini/interview";

function errorResponse(
	code: string,
	message: string,
	status: number,
) {
	return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return errorResponse("INVALID_REQUEST", "Invalid request body.", 400);
	}

	const result = InterviewRequestSchema.safeParse(body);
	if (!result.success) {
		return errorResponse("INVALID_REQUEST", "Invalid interview request.", 400);
	}

	try {
		const response = await runInterview(result.data);
		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		if (error instanceof AppError) {
			return errorResponse(error.code, error.message, error.statusCode);
		}

		logger.error("Interview API request failed", {
			category: "INTERNAL_ERROR",
		});
		return errorResponse(
			"INTERNAL_ERROR",
			"The interview service is temporarily unavailable.",
			500,
		);
	}
}
