import { describe, expect, it } from "vitest";

import {
  formatPercent,
  formatRainfall,
  formatTemperature,
  formatWind,
} from "./formatters";

describe("formatters", () => {
  it("formats weather values with units", () => {
    expect(formatTemperature(31.4, "metric")).toBe("31C");
    expect(formatTemperature(88.8, "imperial")).toBe("89F");
    expect(formatPercent(55)).toBe("55%");
    expect(formatWind(26)).toBe("26 kph");
    expect(formatRainfall(2.25)).toBe("2.3 mm");
  });

  it("renders fallback values", () => {
    expect(formatTemperature(undefined, "metric")).toBe("Not available");
    expect(formatRainfall(undefined)).toBe("Not available");
  });
});
