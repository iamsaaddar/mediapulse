import type { z } from "zod";

import { ApiErrorSchema } from "@/schemas/api";

export type ApiError = z.infer<typeof ApiErrorSchema>;
