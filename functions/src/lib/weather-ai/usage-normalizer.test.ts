import { describe, expect, it } from "vitest";

import { normalizeWeatherAiUsage } from "./usage-normalizer";

describe("normalizeWeatherAiUsage", () => {
  it("normalizes WeatherAI-like usage payloads", () => {
    const usage = normalizeWeatherAiUsage(
      {
        data: {
          planName: "Free",
          requests: {
            used: "12",
            limit: "100",
          },
          ai: {
            current: 3,
            max: 20,
          },
          period: {
            start: "2026-06-01T00:00:00.000Z",
            end: "2026-06-30T23:59:59.000Z",
          },
        },
      },
      {
        fetchedAt: "2026-06-05T09:00:00.000Z",
      },
    );

    expect(usage).toEqual({
      plan: "Free",
      requestsUsed: 12,
      requestsLimit: 100,
      aiRequestsUsed: 3,
      aiRequestsLimit: 20,
      periodStart: "2026-06-01T00:00:00.000Z",
      periodEnd: "2026-06-30T23:59:59.000Z",
      fetchedAt: "2026-06-05T09:00:00.000Z",
    });
  });

  it("tolerates missing optional fields", () => {
    const usage = normalizeWeatherAiUsage(
      {},
      {
        fetchedAt: "2026-06-05T09:00:00.000Z",
      },
    );

    expect(usage).toEqual({
      fetchedAt: "2026-06-05T09:00:00.000Z",
    });
  });
});
