import { ApiErrorSchema } from "@/schemas/api";
import {
	InterviewRequestSchema,
	InterviewResponseSchema,
} from "@/schemas/interview";
import type { InterviewRequest, InterviewResponse } from "@/types/interview";

const SAFE_HTTP_MESSAGES: Record<number, string> = {
	400: "The interview state was not accepted. Please review your answer and try again.",
	429: "The interview service is busy. Please try again shortly.",
	500: "The interview service is temporarily unavailable. Please try again.",
	502: "The interview could not produce a valid response. Please try again.",
	503: "The interview service is temporarily unavailable. Please try again.",
};

export class InterviewApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InterviewApiError";
	}
}

export async function requestInterview(
	request: InterviewRequest,
	fetcher: typeof fetch = fetch,
): Promise<InterviewResponse> {
	const validRequest = InterviewRequestSchema.safeParse(request);
	if (!validRequest.success) {
		throw new InterviewApiError("The interview state is invalid. Please try again.");
	}

	let response: Response;
	try {
		response = await fetcher("/api/interview", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(validRequest.data),
		});
	} catch {
		throw new InterviewApiError(
			"We could not reach the interview service. Check your connection and try again.",
		);
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw new InterviewApiError(
			"The interview service returned an invalid response. Please try again.",
		);
	}

	if (!response.ok) {
		const apiError = ApiErrorSchema.safeParse(body);
		if (apiError.success) {
			throw new InterviewApiError(apiError.data.error.message);
		}
		throw new InterviewApiError(
			SAFE_HTTP_MESSAGES[response.status] ??
				"The interview service is temporarily unavailable. Please try again.",
		);
	}

	const result = InterviewResponseSchema.safeParse(body);
	if (!result.success) {
		throw new InterviewApiError(
			"The interview service returned an invalid response. Please try again.",
		);
	}
	return result.data;
}
