import { describe, expect, it } from "vitest";

import {
  treeAnalysisMetadataSchema,
  usageRequestSchema,
  weatherRequestSchema,
} from "../schemas";

describe("weatherRequestSchema", () => {
  it("accepts a valid metric weather request", () => {
    const parsed = weatherRequestSchema.parse({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 7,
      includeAi: true,
    });

    expect(parsed.units).toBe("metric");
  });

  it("accepts a valid imperial weather request", () => {
    const parsed = weatherRequestSchema.parse({
      lat: 40.7128,
      lon: -74.006,
      units: "imperial",
      days: 3,
      includeAi: false,
    });

    expect(parsed.includeAi).toBe(false);
  });

  it("rejects invalid coordinates, units, and days", () => {
    const result = weatherRequestSchema.safeParse({
      lat: 91,
      lon: -181,
      units: "kelvin",
      days: 8,
      includeAi: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("treeAnalysisMetadataSchema", () => {
  it("accepts optional metadata fields", () => {
    const parsed = treeAnalysisMetadataSchema.parse({
      locationName: "North Orchard",
      landAcres: 12.5,
      notes: "Canopy image after morning inspection.",
    });

    expect(parsed.locationName).toBe("North Orchard");
  });

  it("accepts empty metadata", () => {
    expect(treeAnalysisMetadataSchema.parse({})).toEqual({});
  });

  it("rejects invalid acres and overly long strings", () => {
    const result = treeAnalysisMetadataSchema.safeParse({
      locationName: "x".repeat(121),
      landAcres: -1,
      notes: "x".repeat(501),
    });

    expect(result.success).toBe(false);
  });
});

describe("usageRequestSchema", () => {
  it("accepts an empty usage request", () => {
    expect(usageRequestSchema.parse({})).toEqual({});
  });

  it("rejects unexpected usage request fields", () => {
    const result = usageRequestSchema.safeParse({
      includeAi: true,
    });

    expect(result.success).toBe(false);
  });
});
