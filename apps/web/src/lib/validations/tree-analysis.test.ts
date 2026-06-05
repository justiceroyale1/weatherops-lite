import { describe, expect, it } from "vitest";

import {
  treeAnalysisMetadataSchema,
  validateTreeImageFile,
} from "./tree-analysis";

describe("tree analysis validation", () => {
  it("accepts valid metadata and image files", () => {
    expect(
      treeAnalysisMetadataSchema.parse({
        locationName: "North Farm",
        landAcres: "12.5",
        notes: "Morning canopy image.",
      }),
    ).toEqual({
      locationName: "North Farm",
      landAcres: 12.5,
      notes: "Morning canopy image.",
    });
    expect(validateTreeImageFile(new File(["x"], "field.png", { type: "image/png" }))).toBeUndefined();
  });

  it("rejects invalid files", () => {
    expect(validateTreeImageFile(undefined)).toMatch(/Upload/i);
    expect(validateTreeImageFile(new File([], "field.png", { type: "image/png" }))).toMatch(/non-empty/i);
    expect(validateTreeImageFile(new File(["x"], "field.txt", { type: "text/plain" }))).toMatch(/JPEG, PNG, or WebP/i);
  });
});
