import { describe, expect, it } from "vitest";

import { locationFormSchema } from "./location";

describe("locationFormSchema", () => {
  it("accepts valid location form values", () => {
    const parsed = locationFormSchema.parse({
      name: "Nairobi, Kenya",
      type: "farm",
      lat: "-1.286389",
      lon: "36.817223",
      notes: "Default demo location.",
    });

    expect(parsed).toEqual({
      name: "Nairobi, Kenya",
      type: "farm",
      lat: -1.286389,
      lon: 36.817223,
      notes: "Default demo location.",
    });
  });

  it("rejects invalid location form values", () => {
    const result = locationFormSchema.safeParse({
      name: "N",
      type: "office",
      lat: "-91",
      lon: "181",
      notes: "x".repeat(301),
    });

    expect(result.success).toBe(false);
  });
});
