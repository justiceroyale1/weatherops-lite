import { describe, expect, it } from "vitest";

import { weatherFormSchema } from "./weather";

describe("weatherFormSchema", () => {
  it("accepts valid weather form values", () => {
    const parsed = weatherFormSchema.parse({
      lat: "6.5244",
      lon: "3.3792",
      units: "metric",
      days: "7",
    });

    expect(parsed).toEqual({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 7,
    });
  });

  it("accepts an optional saved location id", () => {
    const parsed = weatherFormSchema.parse({
      lat: "-1.286389",
      lon: "36.817223",
      units: "metric",
      days: "3",
    });

    expect(parsed.lat).toBe(-1.286389);
  });

  it("rejects invalid coordinates and days", () => {
    const result = weatherFormSchema.safeParse({
      lat: 91,
      lon: -181,
      units: "metric",
      days: 8,
    });

    expect(result.success).toBe(false);
  });
});
