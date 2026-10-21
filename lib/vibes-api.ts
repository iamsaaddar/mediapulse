import { ApiErrorSchema } from "@/schemas/api";
import { VibeExtractionRequestSchema, VibeExtractionResponseSchema } from "@/schemas/vibes";
import type { VibeExtractionRequest, VibeExtractionResponse } from "@/schemas/vibes";

export class VibesApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "VibesApiError";
	}
}

export async function requestMovieVibes(request: VibeExtractionRequest, fetcher: typeof fetch = fetch): Promise<VibeExtractionResponse> {
	const valid = VibeExtractionRequestSchema.safeParse(request);
	if (!valid.success) throw new VibesApiError("Enter a movie title to continue.");
	let response: Response;
	try {
		response = await fetcher("/api/vibes", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(valid.data),
		});
	} catch {
		throw new VibesApiError("We could not reach the vibe service. Check your connection and try again.");
	}
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw new VibesApiError("The vibe service returned an invalid response. Please try again.");
	}
	if (!response.ok) {
		const parsed = ApiErrorSchema.safeParse(body);
		throw new VibesApiError(parsed.success ? parsed.data.error.message : "The vibe service is temporarily unavailable. Please try again.");
	}
	const parsed = VibeExtractionResponseSchema.safeParse(body);
	if (!parsed.success) throw new VibesApiError("The vibe service returned an invalid response. Please try again.");
	return parsed.data;
}
