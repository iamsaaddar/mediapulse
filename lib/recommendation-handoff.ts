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

	return {
		async submit(request: RecommendationRequest, retry = false): Promise<void> {
			if (isInFlight || (hasStarted && !retry)) return;

			hasStarted = true;
			isInFlight = true;
			updateState({ status: "loading" });

			try {
				const response = await send(request);
				updateState({ status: "success", response });
			} catch (error) {
				updateState({
					status: "error",
					message:
						error instanceof RecommendationApiError
							? error.message
							: "The recommendation service is temporarily unavailable. Please try again.",
				});
			} finally {
				isInFlight = false;
			}
		},
		reset() {
			if (isInFlight) return;
			hasStarted = false;
			updateState({ status: "idle" });
		},
	};
}
