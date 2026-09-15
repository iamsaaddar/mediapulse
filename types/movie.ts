import type { z } from "zod";

import { VerifiedMovieSchema } from "@/schemas/movie";

export type VerifiedMovie = z.infer<typeof VerifiedMovieSchema>;
