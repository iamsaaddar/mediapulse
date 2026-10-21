import type { VerifiedMovie } from "@/types/movie";
import type { RecommendationCandidate } from "@/types/recommendation";

export interface VerifiedCandidate {
	candidate: RecommendationCandidate;
	movie: VerifiedMovie;
}

const MINIMUM_TASTE_FIT = 0.55;
const LESSER_KNOWN_VOTE_LIMIT = 2_500;

function scoreCandidate(item: VerifiedCandidate): number {
	const normalizedVotes = Math.min(
		Math.log1p(item.movie.voteCount) / Math.log1p(50_000),
		1,
	);
	const discoveryScore = 1 - normalizedVotes;
	return item.candidate.fitScore * 0.5 + discoveryScore * 0.5;
}

function compare(left: VerifiedCandidate, right: VerifiedCandidate): number {
	return scoreCandidate(right) - scoreCandidate(left) || left.movie.tmdbId - right.movie.tmdbId;
}

/**
 * Keeps the film fit score and discovery signal equally weighted. Vote count is
 * log-normalized so one blockbuster cannot dominate the discovery scale.
 */
export function selectBalancedRecommendations(candidates: VerifiedCandidate[], count: number): VerifiedCandidate[] {
	const eligible = candidates
		.filter(({ candidate }) => candidate.fitScore >= MINIMUM_TASTE_FIT)
		.sort(compare);
	const selected: VerifiedCandidate[] = [];
	const selectedIds = new Set<number>();
	const lesserKnown = eligible.filter(({ movie }) => movie.voteCount < LESSER_KNOWN_VOTE_LIMIT);

	// Reserve up to three places for high-fit, lesser-known films when available.
	for (const item of lesserKnown.slice(0, Math.min(3, count))) {
		selected.push(item);
		selectedIds.add(item.movie.tmdbId);
	}
	for (const item of eligible) {
		if (selected.length >= count) break;
		if (selectedIds.has(item.movie.tmdbId)) continue;
		selected.push(item);
		selectedIds.add(item.movie.tmdbId);
	}
	return selected.sort(compare);
}
