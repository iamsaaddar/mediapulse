import { z } from "zod";

const envSchema = z.object({
	GEMINI_API_KEY: z.string().min(1),
	TMDB_API_KEY: z.string().min(1),
});

const geminiEnvSchema = envSchema.pick({ GEMINI_API_KEY: true });

export type Env = z.infer<typeof envSchema>;
export type GeminiEnv = z.infer<typeof geminiEnvSchema>;

export function getEnv(): Env {
	return envSchema.parse({
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		TMDB_API_KEY: process.env.TMDB_API_KEY,
	});
}

export function getGeminiEnv(): GeminiEnv {
	return geminiEnvSchema.parse({
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
	});
}
