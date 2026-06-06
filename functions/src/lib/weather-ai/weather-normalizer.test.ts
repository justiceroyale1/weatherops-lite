import { describe, expect, it } from "vitest";

import { normalizeWeatherAiWeather } from "./weather-normalizer";
import type { WeatherRequest } from "../../schemas";

const request: WeatherRequest = {
  lat: 6.5244,
  lon: 3.3792,
  units: "metric",
  days: 3,
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
      time: undefined,
      temperatureC: undefined,
      temperatureF: undefined,
      feelsLikeC: undefined,
      feelsLikeF: undefined,
      humidityPercent: undefined,
      windSpeedKph: undefined,
      windGustKph: undefined,
      windDirectionDegrees: undefined,
      precipitationProbability: undefined,
      rainfallMm: undefined,
      visibilityKm: undefined,
      uvIndex: undefined,
      conditionCode: undefined,
      conditionText: undefined,
      iconUrl: undefined,
      iconPath: undefined,
    });
    expect(normalized.dashboard.hourly).toEqual([]);
    expect(normalized.dashboard.daily).toEqual([]);
  });

  it("normalizes the actual WeatherAI weather response shape", () => {
    const normalized = normalizeWeatherAiWeather(
      {
        location: {
          lat: 36.74694,
          lon: -119.80077,
          timezone: "America/Los_Angeles",
          requested_lat: 36.7378,
          requested_lon: -119.7871,
          country: "US",
        },
        current: {
          time: "2026-06-06T00:45",
          temperature: 24.7,
          wind_speed: 15.1,
          wind_direction: 320,
          condition_code: "0",
          icon: "https://cdn.weather-ai.co/icons/default/0_clear_night.svg",
          icon_path: "icons/weather/png/wmo-0-night-128.png",
        },
        hourly: [
          {
            time: "2026-06-06T00:00",
            temperature: 25.5,
            precipitation_probability: 0,
            wind_speed: 14.6,
            condition_code: "0",
            icon: "https://cdn.weather-ai.co/icons/default/0_clear_night.svg",
            humidity: 37,
            feels_like: 23.3,
            wind_gust: 30.6,
            uv_index: 0,
            icon_path: "icons/weather/png/wmo-0-night-128.png",
          },
          {
            time: "2026-06-06T01:00",
            temperature: 24.4,
            precipitation_probability: 0,
            wind_speed: 15.3,
            condition_code: "0",
            icon: "https://cdn.weather-ai.co/icons/default/0_clear_night.svg",
            humidity: 33,
            feels_like: 21.4,
            wind_gust: 34.2,
            uv_index: 0,
            icon_path: "icons/weather/png/wmo-0-night-128.png",
          },
        ],
        daily: [
          {
            date: "2026-06-06",
            temp_min: 19.7,
            temp_max: 34.3,
            precipitation_sum: 0,
            sunrise: "2026-06-06T05:40",
            sunset: "2026-06-06T20:15",
            condition_code: "0",
            icon: "https://cdn.weather-ai.co/icons/default/0_clear_day.svg",
            precipitation_probability: 0,
            wind_max: 19.7,
            icon_path: "icons/weather/png/wmo-0-day-128.png",
          },
          {
            date: "2026-06-07",
            temp_min: 14.9,
            temp_max: 32.6,
            precipitation_sum: 0,
            sunrise: "2026-06-07T05:40",
            sunset: "2026-06-07T20:16",
            condition_code: "3",
            icon: "https://cdn.weather-ai.co/icons/default/3_overcast_day.svg",
            precipitation_probability: 0,
            wind_max: 25.5,
            icon_path: "icons/weather/png/wmo-3-day-128.png",
          },
          {
            date: "2026-06-08",
            temp_min: 16.6,
            temp_max: 31,
            precipitation_sum: 0,
            sunrise: "2026-06-08T05:40",
            sunset: "2026-06-08T20:16",
            condition_code: "3",
            icon: "https://cdn.weather-ai.co/icons/default/3_overcast_day.svg",
            precipitation_probability: 0,
            wind_max: 28.8,
            icon_path: "icons/weather/png/wmo-3-day-128.png",
          },
          {
            date: "2026-06-09",
            temp_min: 17.9,
            temp_max: 31.8,
            precipitation_sum: 0,
            condition_code: "0",
            precipitation_probability: 0,
            wind_max: 25,
          },
        ],
        client_geo: {
          country: "ZZ",
          ip_hash: "1843cbfdba7c0054",
        },
      },
      {
        request,
        fetchedAt: "2026-06-06T08:00:00.000Z",
        source: "weatherai",
      },
    );

    expect(normalized.dashboard.location).toEqual({
      lat: 36.74694,
      lon: -119.80077,
      requestedLat: 36.7378,
      requestedLon: -119.7871,
      timezone: "America/Los_Angeles",
      resolvedName: undefined,
      country: "US",
    });
    expect(normalized.dashboard.current).toMatchObject({
      time: "2026-06-06T00:45",
      temperatureC: 24.7,
      feelsLikeC: 21.4,
      humidityPercent: 33,
      windSpeedKph: 15.1,
      windGustKph: 34.2,
      windDirectionDegrees: 320,
      precipitationProbability: 0,
      uvIndex: 0,
      conditionCode: "0",
      conditionText: "Clear sky",
      iconUrl: "https://cdn.weather-ai.co/icons/default/0_clear_night.svg",
      iconPath: "icons/weather/png/wmo-0-night-128.png",
    });
    expect(normalized.dashboard.hourly[0]).toMatchObject({
      time: "2026-06-06T00:00",
      temperatureC: 25.5,
      feelsLikeC: 23.3,
      humidityPercent: 37,
      precipitationProbability: 0,
      windSpeedKph: 14.6,
      windGustKph: 30.6,
      uvIndex: 0,
      conditionCode: "0",
      conditionText: "Clear sky",
      iconPath: "icons/weather/png/wmo-0-night-128.png",
    });
    expect(normalized.dashboard.daily).toHaveLength(3);
    expect(normalized.dashboard.daily[0]).toMatchObject({
      date: "2026-06-06",
      maxTemperatureC: 34.3,
      minTemperatureC: 19.7,
      rainfallMm: 0,
      precipitationProbability: 0,
      maxWindSpeedKph: 19.7,
      sunrise: "2026-06-06T05:40",
      sunset: "2026-06-06T20:15",
      conditionCode: "0",
      conditionText: "Clear sky",
      iconPath: "icons/weather/png/wmo-0-day-128.png",
    });
    expect(normalized.dashboard.daily[1].conditionText).toBe("Overcast");
    expect(JSON.stringify(normalized.dashboard)).not.toContain("1843cbfdba7c0054");
    expect(normalized.riskInput).toMatchObject({
      temperatureC: 24.7,
      humidityPercent: 33,
      windSpeedKph: 15.1,
      windGustKph: 34.2,
      precipitationProbability: 0,
    });
    expect(normalized.riskInput.forecastDays?.[0]).toMatchObject({
      maxTemperatureC: 34.3,
      minTemperatureC: 19.7,
      rainfallMm: 0,
      conditionText: "Clear sky",
    });
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

  it("ignores AI summary fields from upstream weather payloads", () => {
    const normalized = normalizeWeatherAiWeather(
      {
        aiSummary: "This should not be returned.",
        summary: "This should also not be returned.",
        ai: {
          summary: "This nested value should not be returned.",
        },
      },
      {
        request,
        fetchedAt: "2026-06-05T09:00:00.000Z",
        source: "weatherai",
      },
    );

    expect(normalized.dashboard).not.toHaveProperty("aiSummary");
  });
});
