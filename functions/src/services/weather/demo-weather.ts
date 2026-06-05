import type { WeatherRequest } from "../../schemas";

export function createDemoWeatherPayload(input: WeatherRequest): Record<string, unknown> {
  const hourly = Array.from({ length: 6 }, (_, index) => ({
    time: `2026-06-05T${String(8 + index).padStart(2, "0")}:00:00Z`,
    temperatureC: 29 + index,
    precipitationProbability: index < 3 ? 20 : 55,
    rainfallMm: index < 3 ? 0 : 2,
    windSpeedKph: 16 + index,
    conditionText: index < 3 ? "Partly cloudy" : "Rain showers",
  }));

  const daily = Array.from({ length: input.days }, (_, index) => ({
    date: `2026-06-${String(5 + index).padStart(2, "0")}`,
    maxTemperatureC: index === 0 ? 34 : 31,
    minTemperatureC: 22,
    precipitationProbability: index < 2 ? 65 : 25,
    rainfallMm: index < 2 ? 9 : 0,
    conditionText: index < 2 ? "Rain showers" : "Partly cloudy",
  }));

  return {
    location: {
      lat: input.lat,
      lon: input.lon,
      timezone: "Africa/Lagos",
      resolvedName: "Demo Field Site",
    },
    current: {
      temperatureC: 34,
      humidityPercent: 68,
      windSpeedKph: 24,
      windGustKph: 38,
      precipitationProbability: 55,
      rainfallMm: 2,
      visibilityKm: 8,
      conditionText: "Rain showers",
    },
    hourly,
    daily,
    aiSummary: input.includeAi
      ? "Demo summary: warm, humid field conditions with rain risk later today."
      : undefined,
  };
}
