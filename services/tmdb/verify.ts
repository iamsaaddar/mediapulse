import type { RecommendationCandidate } from "@/types/recommendation";
import type { VerifiedMovie } from "@/types/movie";

export async function verifyMovieCandidate(
	_candidate: RecommendationCandidate,
): Promise<VerifiedMovie | null> {
	throw new Error("TMDB movie verification is not implemented yet.");
}
