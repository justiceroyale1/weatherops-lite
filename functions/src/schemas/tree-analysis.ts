import { z } from "zod";

export const treeAnalysisMetadataSchema = z.object({
  locationName: z.string().trim().min(1).max(120).optional(),
  landAcres: z.number().positive().max(100000).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type TreeAnalysisMetadata = z.infer<typeof treeAnalysisMetadataSchema>;
