export const GEMINI_CONFIG = {
	model: "gemini-3.5-flash-lite",
	// A restrained default supports consistent structured output; services can override it.
	defaultTemperature: 0.4,
} as const;
