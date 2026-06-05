import { z } from "zod";

export const maxTreeImageBytes = 8 * 1024 * 1024;
export const acceptedTreeImageTypes = ["image/jpeg", "image/png", "image/webp"];

export const treeAnalysisMetadataSchema = z.object({
  locationName: z.string().trim().max(120, "Location name cannot be more than 120 characters.").optional(),
  landAcres: z.coerce
    .number()
    .positive("Land acres must be greater than 0.")
    .max(100000, "Land acres is too large.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(500, "Notes cannot be more than 500 characters.").optional(),
});

export type TreeAnalysisMetadataInput = z.input<typeof treeAnalysisMetadataSchema>;
export type TreeAnalysisMetadataValues = z.infer<typeof treeAnalysisMetadataSchema>;

export function validateTreeImageFile(file: File | undefined): string | undefined {
  if (!file) {
    return "Upload an image file.";
  }

  if (file.size <= 0) {
    return "Upload a non-empty image file.";
  }

  if (file.size > maxTreeImageBytes) {
    return "Image must be 8MB or smaller.";
  }

  if (!acceptedTreeImageTypes.includes(file.type)) {
    return "Image must be JPEG, PNG, or WebP.";
  }

  return undefined;
}
