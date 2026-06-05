import { describe, expect, it } from "vitest";

import {
  formatPercent,
  formatQuotaValue,
  formatRainfall,
  formatTemperature,
  formatWind,
  getProgressPercent,
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

  it("formats quota values and progress safely", () => {
    expect(formatQuotaValue(25, 100)).toBe("25 / 100");
    expect(formatQuotaValue(25, undefined)).toBe("25 used");
    expect(formatQuotaValue(undefined, 100)).toBe("Usage unavailable");
    expect(getProgressPercent(25, 100)).toBe(25);
    expect(getProgressPercent(125, 100)).toBe(100);
    expect(getProgressPercent(25, 0)).toBe(0);
    expect(getProgressPercent(undefined, 100)).toBe(0);
  });
});
