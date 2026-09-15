export const TASTE_DIMENSIONS = [
	"story",
	"emotion",
	"characters",
	"genre",
	"tone",
	"pacing",
	"complexity",
	"themes",
	"visual_style",
	"ending_preference",
] as const;

export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];
