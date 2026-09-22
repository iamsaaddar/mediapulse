import type {
	RecommendationRequest,
	RecommendationResponse,
} from "@/types/recommendation";

export async function generateRecommendationResponse(
	_request: RecommendationRequest,
): Promise<RecommendationResponse> {
	throw new Error(
		"Recommendation orchestration is not implemented yet.",
	);
}
