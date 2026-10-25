import type { z } from "zod";

import { DiscoveredMovieSchema, VerifiedMovieSchema } from "@/schemas/movie";

export type VerifiedMovie = z.infer<typeof VerifiedMovieSchema>;
export type DiscoveredMovie = z.infer<typeof DiscoveredMovieSchema>;
