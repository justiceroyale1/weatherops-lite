import { describe, expect, it } from "vitest";

import { validateTreeAnalysisFile } from "./file-validation";
import type { TreeAnalysisFile } from "./types";

describe("validateTreeAnalysisFile", () => {
  it("accepts supported image files under 8MB", () => {
    expect(() =>
      validateTreeAnalysisFile(createFile("image/jpeg", 128)),
    ).not.toThrow();
    expect(() =>
      validateTreeAnalysisFile(createFile("image/png", 128)),
    ).not.toThrow();
    expect(() =>
      validateTreeAnalysisFile(createFile("image/webp", 128)),
    ).not.toThrow();
  });

  it("rejects empty, unsupported, and oversized files", () => {
    expect(() => validateTreeAnalysisFile(createFile("image/jpeg", 0))).toThrow(
      /non-empty/i,
    );
    expect(() => validateTreeAnalysisFile(createFile("text/plain", 128))).toThrow(
      /JPEG, PNG, or WebP/i,
    );
    expect(() =>
      validateTreeAnalysisFile(createFile("image/png", 8 * 1024 * 1024 + 1)),
    ).toThrow(/8MB/i);
  });
});

function createFile(contentType: string, size: number): TreeAnalysisFile {
  return {
    buffer: Buffer.alloc(size),
    contentType,
    filename: "field.png",
    size,
  };
}
