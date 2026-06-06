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

  it("normalizes the actual WeatherAI usage payload shape", () => {
    const usage = normalizeWeatherAiUsage(
      {
        plan: "free",
        period: {
          start: "2026-06-06T05:52:48.662Z",
          end: "2026-07-06T05:52:48.662Z",
          requestCount: 5,
          aiRequestCount: 1,
        },
        limits: {
          requests: 1000,
          aiRequests: 200,
          maxDays: 7,
          webhooks: false,
          teamSeats: 1,
          sms: false,
        },
        remaining: {
          requests: 995,
          aiRequests: 199,
        },
      },
      {
        fetchedAt: "2026-06-06T06:00:00.000Z",
      },
    );

    expect(usage).toEqual({
      plan: "free",
      requestsUsed: 5,
      requestsLimit: 1000,
      aiRequestsUsed: 1,
      aiRequestsLimit: 200,
      periodStart: "2026-06-06T05:52:48.662Z",
      periodEnd: "2026-07-06T05:52:48.662Z",
      fetchedAt: "2026-06-06T06:00:00.000Z",
    });
    expect(usage).not.toHaveProperty("remaining");
    expect(usage).not.toHaveProperty("maxDays");
    expect(usage).not.toHaveProperty("webhooks");
    expect(usage).not.toHaveProperty("teamSeats");
    expect(usage).not.toHaveProperty("sms");
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
