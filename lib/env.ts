import { z } from "zod";

const envSchema = z.object({
	GEMINI_API_KEY: z.string().min(1),
	TMDB_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
	return envSchema.parse({
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		TMDB_API_KEY: process.env.TMDB_API_KEY,
	});
}
