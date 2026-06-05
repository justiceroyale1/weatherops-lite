import { describe, expect, it } from "vitest";

import { weatherFormSchema } from "./weather";

describe("weatherFormSchema", () => {
  it("accepts valid weather form values", () => {
    const parsed = weatherFormSchema.parse({
      lat: "6.5244",
      lon: "3.3792",
      units: "metric",
      days: "7",
      includeAi: true,
    });

    expect(parsed).toEqual({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 7,
      includeAi: true,
    });
  });

  it("rejects invalid coordinates and days", () => {
    const result = weatherFormSchema.safeParse({
      lat: 91,
      lon: -181,
      units: "metric",
      days: 8,
      includeAi: false,
    });

    expect(result.success).toBe(false);
  });
});
