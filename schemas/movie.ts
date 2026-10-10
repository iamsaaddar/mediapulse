import { z } from "zod";
import {
	MAX_MOVIE_GENRES,
	MAX_MOVIE_IMAGE_PATH_LENGTH,
	MAX_MOVIE_LANGUAGE_LENGTH,
	MAX_MOVIE_OVERVIEW_LENGTH,
	MAX_MOVIE_RELEASE_DATE_LENGTH,
	MAX_MOVIE_TITLE_LENGTH,
} from "@/constants/limits";
import { boundedNonBlankText } from "./common";

export const VerifiedMovieSchema = z.object({
	tmdbId: z.number().int().positive(),

	title: boundedNonBlankText(MAX_MOVIE_TITLE_LENGTH),
	originalTitle: boundedNonBlankText(MAX_MOVIE_TITLE_LENGTH),

	releaseDate: z.string().max(MAX_MOVIE_RELEASE_DATE_LENGTH),

	overview: z.string().max(MAX_MOVIE_OVERVIEW_LENGTH),

	posterPath: z.string().max(MAX_MOVIE_IMAGE_PATH_LENGTH).nullable(),
	backdropPath: z.string().max(MAX_MOVIE_IMAGE_PATH_LENGTH).nullable(),

	rating: z.number().min(0).max(10),
	voteCount: z.number().int().min(0),

	genreIds: z.array(z.number().int().positive()).max(MAX_MOVIE_GENRES),

	originalLanguage: boundedNonBlankText(MAX_MOVIE_LANGUAGE_LENGTH),
}).strict();
