import { z } from "zod";

export const usageRequestSchema = z.object({}).strict();

export type UsageRequest = z.infer<typeof usageRequestSchema>;
