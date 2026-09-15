import { z } from "zod";

export const VerifiedMovieSchema = z.object({
	tmdbId: z.number().int().positive(),

	title: z.string().min(1),
	originalTitle: z.string().min(1),

	releaseDate: z.string(),

	overview: z.string(),

	posterPath: z.string().nullable(),
	backdropPath: z.string().nullable(),

	rating: z.number().min(0).max(10),
	voteCount: z.number().int().min(0),

	genreIds: z.array(z.number().int()),

	originalLanguage: z.string().min(1),
});
