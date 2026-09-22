import type {
	RecommendationCandidate,
	RecommendationRequest,
} from "@/types/recommendation";

export async function generateRecommendations(
	_request: RecommendationRequest,
): Promise<RecommendationCandidate[]> {
	throw new Error(
		"Gemini recommendation service is not implemented yet.",
	);
}
