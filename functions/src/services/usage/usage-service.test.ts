import { describe, expect, it } from "vitest";

import type { RuntimeConfig } from "../../config";
import { UsageService, type UsageDataClient } from "./usage-service";

const baseConfig: RuntimeConfig = {
  allowedOrigins: ["http://localhost:5173"],
  enableDemoMode: false,
  weatherAiBaseUrl: "https://api.weather-ai.co",
};

describe("UsageService", () => {
  it("returns demo usage when demo mode is enabled", async () => {
    const service = new UsageService({
      config: {
        ...baseConfig,
        enableDemoMode: true,
      },
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    const usage = await service.getUsage();

    expect(usage).toMatchObject({
      plan: "Demo",
      requestsUsed: 124,
      requestsLimit: 500,
      aiRequestsUsed: 37,
      aiRequestsLimit: 100,
      fetchedAt: "2026-06-05T09:00:00.000Z",
    });
  });

  it("returns demo usage when no WeatherAI API key is configured", async () => {
    const service = new UsageService({
      config: baseConfig,
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    expect((await service.getUsage()).plan).toBe("Demo");
  });

  it("normalizes WeatherAI usage from the client", async () => {
    const client: UsageDataClient = {
      async getUsage() {
        return {
          plan: "Free",
          requestsUsed: 10,
          requestsLimit: 100,
        };
      },
    };
    const service = new UsageService({
      client,
      config: {
        ...baseConfig,
        weatherAiApiKey: "test-secret",
      },
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    expect(await service.getUsage()).toEqual({
      plan: "Free",
      requestsUsed: 10,
      requestsLimit: 100,
      fetchedAt: "2026-06-05T09:00:00.000Z",
    });
  });
});
