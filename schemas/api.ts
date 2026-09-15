import { z } from "zod";

export const ApiErrorCodeSchema = z.enum([
	"INVALID_REQUEST",
	"AI_SERVICE_ERROR",
	"MOVIE_DATA_ERROR",
	"INSUFFICIENT_RESULTS",
	"RATE_LIMITED",
	"INTERNAL_ERROR",
]);

export const ApiErrorSchema = z.object({
	error: z.object({
		code: ApiErrorCodeSchema,
		message: z.string().min(1),
	}),
});
