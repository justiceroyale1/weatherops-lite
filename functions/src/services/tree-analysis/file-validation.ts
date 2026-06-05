import { AppError } from "../../lib/errors";
import type { TreeAnalysisFile } from "./types";

export const maxTreeImageBytes = 8 * 1024 * 1024;
export const acceptedTreeImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function validateTreeAnalysisFile(file: TreeAnalysisFile): void {
  if (file.size <= 0 || file.buffer.length <= 0) {
    throw new AppError("VALIDATION_ERROR", 400, "Upload a non-empty image file.");
  }

  if (file.size > maxTreeImageBytes || file.buffer.length > maxTreeImageBytes) {
    throw new AppError("VALIDATION_ERROR", 400, "Image must be 8MB or smaller.");
  }

  if (!acceptedTreeImageTypes.includes(file.contentType)) {
    throw new AppError(
      "VALIDATION_ERROR",
      400,
      "Image must be JPEG, PNG, or WebP.",
    );
  }
}
