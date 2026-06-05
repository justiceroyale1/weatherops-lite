import { describe, expect, it } from "vitest";

import type { RuntimeConfig } from "../../config";
import type {
  LocationLastRiskUpdate,
  LocationProfile,
  LocationRepository,
} from "../locations";
import type { CreateLocationInput } from "../../schemas";
import { WeatherService, type WeatherDataClient } from "./weather-service";

const baseConfig: RuntimeConfig = {
  allowedOrigins: ["http://localhost:5173"],
  enableDemoMode: false,
  weatherAiBaseUrl: "https://api.weather-ai.co",
};

describe("WeatherService", () => {
  it("returns demo fallback when demo mode is enabled", async () => {
    const service = new WeatherService({
      config: {
        ...baseConfig,
        enableDemoMode: true,
      },
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    const response = await service.getDashboardWeather({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 3,
      includeAi: true,
    });

    expect(response.source).toBe("demo");
    expect(response.location.resolvedName).toBe("Demo Field Site");
    expect(response.risk.level).toBe("High");
    expect(response.aiSummary).toContain("Demo summary");
  });

  it("returns demo fallback when no WeatherAI API key is configured", async () => {
    const service = new WeatherService({
      config: baseConfig,
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    const response = await service.getDashboardWeather({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 1,
      includeAi: false,
    });

    expect(response.source).toBe("demo");
    expect(response.aiSummary).toBeUndefined();
  });

  it("returns normalized WeatherAI response and calculated risk", async () => {
    const client: WeatherDataClient = {
      async getWeather() {
        return {
          location: {
            lat: 6.5244,
            lon: 3.3792,
          },
          current: {
            temperatureC: 38,
            windSpeedKph: 41,
            precipitationProbability: 75,
          },
          daily: [
            {
              date: "2026-06-05",
              maxTemperatureC: 39,
              minTemperatureC: 22,
              precipitationProbability: 80,
              rainfallMm: 14,
            },
          ],
          aiSummary: "High-risk field conditions.",
        };
      },
    };
    const service = new WeatherService({
      config: {
        ...baseConfig,
        weatherAiApiKey: "test-secret",
      },
      client,
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    const response = await service.getDashboardWeather({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 1,
      includeAi: true,
    });

    expect(response.source).toBe("weatherai");
    expect(response.fetchedAt).toBe("2026-06-05T09:00:00.000Z");
    expect(response.risk.level).toBe("Critical");
    expect(response.risk.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "heavy-rain-probability" }),
        expect.objectContaining({ id: "high-wind" }),
        expect.objectContaining({ id: "extreme-heat" }),
      ]),
    );
  });

  it("updates saved location last risk after a location refresh", async () => {
    const repository = new SpyLocationRepository();
    const service = new WeatherService({
      config: {
        ...baseConfig,
        enableDemoMode: true,
      },
      locationRepository: repository,
      now: () => new Date("2026-06-05T09:00:00.000Z"),
    });

    const response = await service.getDashboardWeather({
      lat: -1.286389,
      lon: 36.817223,
      units: "metric",
      days: 3,
      includeAi: true,
      locationId: "demo-nairobi-kenya",
    });

    expect(repository.lastUpdate).toEqual({
      id: "demo-nairobi-kenya",
      update: {
        riskScore: response.risk.score,
        riskLevel: response.risk.level,
        checkedAt: "2026-06-05T09:00:00.000Z",
      },
    });
  });
});

class SpyLocationRepository implements LocationRepository {
  lastUpdate?: { id: string; update: LocationLastRiskUpdate };

  async create(_input: CreateLocationInput): Promise<LocationProfile> {
    throw new Error("not used");
  }

  async delete(_id: string): Promise<void> {
    throw new Error("not used");
  }

  async ensureDefaults(): Promise<void> {
    throw new Error("not used");
  }

  async list(): Promise<LocationProfile[]> {
    throw new Error("not used");
  }

  async updateLastRisk(
    id: string,
    update: LocationLastRiskUpdate,
  ): Promise<void> {
    this.lastUpdate = { id, update };
  }
}
