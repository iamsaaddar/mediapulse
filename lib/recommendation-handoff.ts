import {
	RecommendationApiError,
	requestRecommendations,
} from "@/lib/recommendation-api";
import type {
	RecommendationHandoffState,
	RecommendationRequest,
	RecommendationResponse,
} from "@/types/recommendation";

type RecommendationSender = (
	request: RecommendationRequest,
) => Promise<RecommendationResponse>;

export function createRecommendationHandoff(
	updateState: (state: RecommendationHandoffState) => void,
	send: RecommendationSender = requestRecommendations,
) {
	let hasStarted = false;
	let isInFlight = false;
	let generation = 0;

	return {
		async submit(request: RecommendationRequest, retry = false): Promise<void> {
			if (isInFlight || (hasStarted && !retry)) return;

			const requestGeneration = generation;
			hasStarted = true;
			isInFlight = true;
			updateState({ status: "loading" });

			try {
				const response = await send(request);
				if (requestGeneration === generation) {
					updateState({ status: "success", response });
				}
			} catch (error) {
				if (requestGeneration === generation) {
					updateState({
						status: "error",
						message:
							error instanceof RecommendationApiError
								? error.message
								: "The recommendation service is temporarily unavailable. Please try again.",
					});
				}
			} finally {
				if (requestGeneration === generation) {
					isInFlight = false;
				}
			}
		},
		reset() {
			generation += 1;
			hasStarted = false;
			isInFlight = false;
			updateState({ status: "idle" });
		},
	};
}
