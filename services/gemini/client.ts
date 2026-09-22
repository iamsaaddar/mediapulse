import { GoogleGenAI } from "@google/genai";

import { getEnv } from "@/lib/env";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
	if (client) {
		return client;
	}

	const { GEMINI_API_KEY } = getEnv();

	client = new GoogleGenAI({
		apiKey: GEMINI_API_KEY,
	});

	return client;
}
