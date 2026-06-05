import type { WeatherRequest } from "../../schemas";
import type { NormalizedWeatherInput } from "../../services/risk";
import type {
  CurrentWeather,
  DailyForecastPoint,
  HourlyForecastPoint,
  WeatherDashboardResponse,
  WeatherLocation,
} from "../../services/weather/types";

export interface NormalizedWeatherResult {
  dashboard: Omit<WeatherDashboardResponse, "risk">;
  riskInput: NormalizedWeatherInput;
}

export interface WeatherNormalizerOptions {
  request: WeatherRequest;
  fetchedAt: string;
  source: "weatherai" | "demo";
}

export function normalizeWeatherAiWeather(
  raw: unknown,
  options: WeatherNormalizerOptions,
): NormalizedWeatherResult {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? root;
  const locationRaw = asRecord(data.location) ?? asRecord(data.place);
  const currentRaw = asRecord(data.current) ?? asRecord(data.now);
  const forecastRaw = asRecord(data.forecast);
  const hourlyRaw = asArray(data.hourly) ?? asArray(forecastRaw?.hourly) ?? [];
  const dailyRaw = asArray(data.daily) ?? asArray(forecastRaw?.daily) ?? [];

  const location: WeatherLocation = {
    lat: numberFrom(locationRaw?.lat, locationRaw?.latitude) ?? options.request.lat,
    lon:
      numberFrom(locationRaw?.lon, locationRaw?.lng, locationRaw?.longitude) ??
      options.request.lon,
    timezone: stringFrom(locationRaw?.timezone, data.timezone),
    resolvedName: stringFrom(locationRaw?.name, locationRaw?.resolvedName, data.resolvedName),
  };
  const current = normalizeCurrent(currentRaw);
  const hourly = hourlyRaw.map(normalizeHourlyPoint);
  const daily = dailyRaw.slice(0, options.request.days).map(normalizeDailyPoint);
  const aiSummary = options.request.includeAi
    ? stringFrom(data.aiSummary, data.summary, asRecord(data.ai)?.summary)
    : undefined;

  return {
    dashboard: {
      location,
      current,
      hourly,
      daily,
      ...(aiSummary ? { aiSummary } : {}),
      fetchedAt: options.fetchedAt,
      source: options.source,
    },
    riskInput: {
      temperatureC: current.temperatureC,
      humidityPercent: current.humidityPercent,
      windSpeedKph: current.windSpeedKph,
      windGustKph: current.windGustKph,
      precipitationProbability: current.precipitationProbability,
      rainfallMm: current.rainfallMm,
      visibilityKm: current.visibilityKm,
      conditionText: current.conditionText,
      forecastDays: daily.map((day) => ({
        date: day.date,
        precipitationProbability: day.precipitationProbability,
        rainfallMm: day.rainfallMm,
        maxTemperatureC: day.maxTemperatureC,
        minTemperatureC: day.minTemperatureC,
        conditionText: day.conditionText,
      })),
    },
  };
}

function normalizeCurrent(raw: Record<string, unknown> | undefined): CurrentWeather {
  return {
    temperatureC: numberFrom(raw?.temperatureC, raw?.tempC, raw?.temp_c, raw?.temperature),
    temperatureF: numberFrom(raw?.temperatureF, raw?.tempF, raw?.temp_f),
    humidityPercent: numberFrom(raw?.humidityPercent, raw?.humidity, raw?.relativeHumidity),
    windSpeedKph: numberFrom(raw?.windSpeedKph, raw?.wind_kph, raw?.windSpeed),
    windGustKph: numberFrom(raw?.windGustKph, raw?.gust_kph, raw?.windGust),
    precipitationProbability: numberFrom(
      raw?.precipitationProbability,
      raw?.precipProbability,
      raw?.chanceOfRain,
      raw?.pop,
    ),
    rainfallMm: numberFrom(raw?.rainfallMm, raw?.precipMm, raw?.precip_mm, raw?.rain),
    visibilityKm: numberFrom(raw?.visibilityKm, raw?.vis_km, raw?.visibility),
    conditionText: stringFrom(raw?.conditionText, raw?.condition, raw?.description),
  };
}

function normalizeHourlyPoint(rawValue: unknown): HourlyForecastPoint {
  const raw = asRecord(rawValue);

  return {
    time: stringFrom(raw?.time, raw?.timestamp, raw?.dateTime) ?? "",
    temperatureC: numberFrom(raw?.temperatureC, raw?.tempC, raw?.temp_c, raw?.temperature),
    temperatureF: numberFrom(raw?.temperatureF, raw?.tempF, raw?.temp_f),
    precipitationProbability: numberFrom(
      raw?.precipitationProbability,
      raw?.precipProbability,
      raw?.chanceOfRain,
      raw?.pop,
    ),
    rainfallMm: numberFrom(raw?.rainfallMm, raw?.precipMm, raw?.precip_mm, raw?.rain),
    windSpeedKph: numberFrom(raw?.windSpeedKph, raw?.wind_kph, raw?.windSpeed),
    conditionText: stringFrom(raw?.conditionText, raw?.condition, raw?.description),
  };
}

function normalizeDailyPoint(rawValue: unknown): DailyForecastPoint {
  const raw = asRecord(rawValue);

  return {
    date: stringFrom(raw?.date, raw?.day) ?? "",
    maxTemperatureC: numberFrom(raw?.maxTemperatureC, raw?.maxTempC, raw?.maxtemp_c),
    minTemperatureC: numberFrom(raw?.minTemperatureC, raw?.minTempC, raw?.mintemp_c),
    maxTemperatureF: numberFrom(raw?.maxTemperatureF, raw?.maxTempF, raw?.maxtemp_f),
    minTemperatureF: numberFrom(raw?.minTemperatureF, raw?.minTempF, raw?.mintemp_f),
    precipitationProbability: numberFrom(
      raw?.precipitationProbability,
      raw?.precipProbability,
      raw?.chanceOfRain,
      raw?.pop,
    ),
    rainfallMm: numberFrom(raw?.rainfallMm, raw?.precipMm, raw?.totalprecip_mm, raw?.rain),
    conditionText: stringFrom(raw?.conditionText, raw?.condition, raw?.description),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function numberFrom(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function stringFrom(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return undefined;
}
