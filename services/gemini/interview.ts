import type {
	InterviewRequest,
	InterviewResponse,
} from "@/types/interview";

export async function runInterview(
	_request: InterviewRequest,
): Promise<InterviewResponse> {
	throw new Error("Gemini interview service is not implemented yet.");
}
