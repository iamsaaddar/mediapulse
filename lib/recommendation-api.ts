import { ApiErrorSchema } from "@/schemas/api";
import {
	RecommendationRequestSchema,
	RecommendationResponseSchema,
} from "@/schemas/recommendations";
import type { InterviewResponse } from "@/types/interview";
import type {
	RecommendationRequest,
	RecommendationResponse,
} from "@/types/recommendation";

const SAFE_ERROR_MESSAGES: Record<string, string> = {
	INVALID_REQUEST: "Your completed interview could not be used. Please try again.",
	AI_SERVICE_ERROR: "The recommendation service is temporarily unavailable. Please try again.",
	MOVIE_DATA_ERROR: "The movie data service is temporarily unavailable. Please try again.",
	INSUFFICIENT_RESULTS: "We could not verify enough recommendations. Please try again.",
	RATE_LIMITED: "The recommendation service is busy. Please try again shortly.",
	INTERNAL_ERROR: "The recommendation service is temporarily unavailable. Please try again.",
};

export class RecommendationApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RecommendationApiError";
	}
}

export function createRecommendationRequest(
	completion: Extract<InterviewResponse, { status: "complete" }>,
): RecommendationRequest {
	return RecommendationRequestSchema.parse({
		tasteProfile: completion.tasteUpdate,
		confidence: completion.confidence,
		personality: completion.personality,
	});
}

export async function requestRecommendations(
	request: RecommendationRequest,
	fetcher: typeof fetch = fetch,
): Promise<RecommendationResponse> {
	const validRequest = RecommendationRequestSchema.safeParse(request);
	if (!validRequest.success) {
		throw new RecommendationApiError(
			"The completed interview state is invalid. Please try again.",
		);
	}

	let response: Response;
	try {
		response = await fetcher("/api/recommendations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(validRequest.data),
		});
	} catch {
		throw new RecommendationApiError(
			"We could not reach the recommendation service. Check your connection and try again.",
		);
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw new RecommendationApiError(
			"The recommendation service returned an invalid response. Please try again.",
		);
	}

	if (!response.ok) {
		const apiError = ApiErrorSchema.safeParse(body);
		const message = apiError.success
			? SAFE_ERROR_MESSAGES[apiError.data.error.code]
			: undefined;
		throw new RecommendationApiError(
			message ??
				SAFE_ERROR_MESSAGES[response.status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR"],
		);
	}

	const result = RecommendationResponseSchema.safeParse(body);
	if (!result.success) {
		throw new RecommendationApiError(
			"The recommendation service returned an invalid response. Please try again.",
		);
	}
	return result.data;
}
