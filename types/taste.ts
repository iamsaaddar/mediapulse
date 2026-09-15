import type { z } from "zod";

import { TasteProfileSchema, TasteSignalSchema } from "@/schemas/common";

export type TasteProfile = z.infer<typeof TasteProfileSchema>;
export type TasteSignal = z.infer<typeof TasteSignalSchema>;
