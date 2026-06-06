import { describe, expect, it } from "vitest";

import {
  createLocationSchema,
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
    });

    expect(parsed.units).toBe("metric");
  });

  it("accepts a valid imperial weather request", () => {
    const parsed = weatherRequestSchema.parse({
      lat: 40.7128,
      lon: -74.006,
      units: "imperial",
      days: 3,
    });

    expect(parsed.days).toBe(3);
  });

  it("rejects invalid coordinates, units, and days", () => {
    const result = weatherRequestSchema.safeParse({
      lat: 91,
      lon: -181,
      units: "kelvin",
      days: 8,
    });

    expect(result.success).toBe(false);
  });
});

describe("createLocationSchema", () => {
  it("accepts valid location input", () => {
    const parsed = createLocationSchema.parse({
      name: "Nairobi, Kenya",
      type: "farm",
      lat: -1.286389,
      lon: 36.817223,
      notes: "Default demo location.",
    });

    expect(parsed.name).toBe("Nairobi, Kenya");
  });

  it("rejects invalid location input", () => {
    const result = createLocationSchema.safeParse({
      name: "N",
      type: "office",
      lat: -91,
      lon: 181,
      notes: "x".repeat(301),
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
