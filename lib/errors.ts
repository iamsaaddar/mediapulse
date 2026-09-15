export type AppErrorCode =
	| "INVALID_REQUEST"
	| "AI_SERVICE_ERROR"
	| "MOVIE_DATA_ERROR"
	| "INSUFFICIENT_RESULTS"
	| "RATE_LIMITED"
	| "INTERNAL_ERROR";

export class AppError extends Error {
	constructor(
		public readonly code: AppErrorCode,
		message: string,
		public readonly statusCode: number,
	) {
		super(message);
		this.name = "AppError";
	}
}
