import { describe, expect, it } from "vitest";

import { normalizeWeatherAiWeather } from "./weather-normalizer";
import type { WeatherRequest } from "../../schemas";

const request: WeatherRequest = {
  lat: 6.5244,
  lon: 3.3792,
  units: "metric",
  days: 3,
  includeAi: true,
};

describe("normalizeWeatherAiWeather", () => {
  it("converts a WeatherAI-like payload into the dashboard response shape", () => {
    const normalized = normalizeWeatherAiWeather(
      {
        location: {
          latitude: "6.5",
          longitude: "3.4",
          timezone: "Africa/Lagos",
          name: "Lagos Field",
        },
        current: {
          temp_c: 31,
          humidity: 68,
          wind_kph: 18,
          gust_kph: 28,
          chanceOfRain: 45,
          precip_mm: 1.5,
          vis_km: 9,
          condition: "Partly cloudy",
        },
        forecast: {
          hourly: [
            {
              time: "2026-06-05T09:00:00Z",
              temp_c: 30,
              chanceOfRain: 20,
              precip_mm: 0,
              wind_kph: 12,
              condition: "Clear",
            },
          ],
          daily: [
            {
              date: "2026-06-05",
              maxtemp_c: 33,
              mintemp_c: 24,
              chanceOfRain: 55,
              totalprecip_mm: 4,
              condition: "Showers",
            },
          ],
        },
        aiSummary: "Field conditions are workable with rain monitoring.",
      },
      {
        request,
        fetchedAt: "2026-06-05T09:00:00.000Z",
        source: "weatherai",
      },
    );

    expect(normalized.dashboard).toMatchObject({
      location: {
        lat: 6.5,
        lon: 3.4,
        timezone: "Africa/Lagos",
        resolvedName: "Lagos Field",
      },
      current: {
        temperatureC: 31,
        humidityPercent: 68,
        windSpeedKph: 18,
      },
      aiSummary: "Field conditions are workable with rain monitoring.",
      fetchedAt: "2026-06-05T09:00:00.000Z",
      source: "weatherai",
    });
    expect(normalized.dashboard.hourly).toHaveLength(1);
    expect(normalized.dashboard.daily).toHaveLength(1);
  });

  it("tolerates unknown fields and missing optional fields", () => {
    const normalized = normalizeWeatherAiWeather(
      {
        unexpected: true,
        location: {
          lat: undefined,
        },
      },
      {
        request,
        fetchedAt: "2026-06-05T09:00:00.000Z",
        source: "weatherai",
      },
    );

    expect(normalized.dashboard.location.lat).toBe(request.lat);
    expect(normalized.dashboard.location.lon).toBe(request.lon);
    expect(normalized.dashboard.current).toEqual({
      temperatureC: undefined,
      temperatureF: undefined,
      humidityPercent: undefined,
      windSpeedKph: undefined,
      windGustKph: undefined,
      precipitationProbability: undefined,
      rainfallMm: undefined,
      visibilityKm: undefined,
      conditionText: undefined,
    });
    expect(normalized.dashboard.hourly).toEqual([]);
    expect(normalized.dashboard.daily).toEqual([]);
  });

  it("prepares risk input from current and daily forecast data", () => {
    const normalized = normalizeWeatherAiWeather(
      {
        current: {
          temperatureC: 39,
          windSpeedKph: 44,
          precipitationProbability: 80,
          conditionText: "Storm",
        },
        daily: [
          {
            date: "2026-06-05",
            maxTemperatureC: 40,
            minTemperatureC: 24,
            precipitationProbability: 85,
            rainfallMm: 12,
          },
        ],
      },
      {
        request,
        fetchedAt: "2026-06-05T09:00:00.000Z",
        source: "weatherai",
      },
    );

    expect(normalized.riskInput).toMatchObject({
      temperatureC: 39,
      windSpeedKph: 44,
      precipitationProbability: 80,
      conditionText: "Storm",
    });
    expect(normalized.riskInput.forecastDays).toEqual([
      expect.objectContaining({
        maxTemperatureC: 40,
        precipitationProbability: 85,
        rainfallMm: 12,
      }),
    ]);
  });

  it("omits AI summary when includeAi is false", () => {
    const normalized = normalizeWeatherAiWeather(
      {
        aiSummary: "This should not be returned.",
      },
      {
        request: {
          ...request,
          includeAi: false,
        },
        fetchedAt: "2026-06-05T09:00:00.000Z",
        source: "weatherai",
      },
    );

    expect(normalized.dashboard.aiSummary).toBeUndefined();
  });
});
