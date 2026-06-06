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
  const currentFallbackRaw = findNearestHourlyPoint(currentRaw, hourlyRaw);

  const location: WeatherLocation = {
    lat: numberFrom(locationRaw?.lat, locationRaw?.latitude) ?? options.request.lat,
    lon:
      numberFrom(locationRaw?.lon, locationRaw?.lng, locationRaw?.longitude) ??
      options.request.lon,
    requestedLat: numberFrom(locationRaw?.requestedLat, locationRaw?.requested_lat),
    requestedLon: numberFrom(
      locationRaw?.requestedLon,
      locationRaw?.requested_lon,
    ),
    timezone: stringFrom(locationRaw?.timezone, data.timezone),
    resolvedName: stringFrom(locationRaw?.name, locationRaw?.resolvedName, data.resolvedName),
    country: stringFrom(locationRaw?.country),
  };
  const current = normalizeCurrent(currentRaw, currentFallbackRaw);
  const hourly = hourlyRaw.map(normalizeHourlyPoint);
  const daily = dailyRaw.slice(0, options.request.days).map(normalizeDailyPoint);

  return {
    dashboard: {
      location,
      current,
      hourly,
      daily,
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

function normalizeCurrent(
  raw: Record<string, unknown> | undefined,
  fallbackRaw: Record<string, unknown> | undefined,
): CurrentWeather {
  const conditionCode = stringFrom(raw?.conditionCode, raw?.condition_code);

  return {
    time: stringFrom(raw?.time, raw?.timestamp, raw?.dateTime),
    temperatureC: numberFrom(raw?.temperatureC, raw?.tempC, raw?.temp_c, raw?.temperature),
    temperatureF: numberFrom(raw?.temperatureF, raw?.tempF, raw?.temp_f),
    feelsLikeC: numberFrom(
      raw?.feelsLikeC,
      raw?.feels_like_c,
      raw?.feels_like,
      fallbackRaw?.feelsLikeC,
      fallbackRaw?.feels_like_c,
      fallbackRaw?.feels_like,
    ),
    feelsLikeF: numberFrom(raw?.feelsLikeF, raw?.feels_like_f),
    humidityPercent: numberFrom(
      raw?.humidityPercent,
      raw?.humidity,
      raw?.relativeHumidity,
      fallbackRaw?.humidityPercent,
      fallbackRaw?.humidity,
      fallbackRaw?.relativeHumidity,
    ),
    windSpeedKph: numberFrom(
      raw?.windSpeedKph,
      raw?.wind_kph,
      raw?.windSpeed,
      raw?.wind_speed,
      fallbackRaw?.windSpeedKph,
      fallbackRaw?.wind_kph,
      fallbackRaw?.windSpeed,
      fallbackRaw?.wind_speed,
    ),
    windGustKph: numberFrom(
      raw?.windGustKph,
      raw?.gust_kph,
      raw?.windGust,
      raw?.wind_gust,
      fallbackRaw?.windGustKph,
      fallbackRaw?.gust_kph,
      fallbackRaw?.windGust,
      fallbackRaw?.wind_gust,
    ),
    windDirectionDegrees: numberFrom(
      raw?.windDirectionDegrees,
      raw?.wind_direction,
      raw?.wind_dir_degrees,
    ),
    precipitationProbability: numberFrom(
      raw?.precipitationProbability,
      raw?.precipitation_probability,
      raw?.precipProbability,
      raw?.chanceOfRain,
      raw?.pop,
      fallbackRaw?.precipitationProbability,
      fallbackRaw?.precipitation_probability,
      fallbackRaw?.precipProbability,
      fallbackRaw?.chanceOfRain,
      fallbackRaw?.pop,
    ),
    rainfallMm: numberFrom(
      raw?.rainfallMm,
      raw?.precipMm,
      raw?.precip_mm,
      raw?.rain,
      fallbackRaw?.rainfallMm,
      fallbackRaw?.precipMm,
      fallbackRaw?.precip_mm,
      fallbackRaw?.rain,
    ),
    visibilityKm: numberFrom(raw?.visibilityKm, raw?.vis_km, raw?.visibility),
    uvIndex: numberFrom(raw?.uvIndex, raw?.uv_index, fallbackRaw?.uvIndex, fallbackRaw?.uv_index),
    conditionCode,
    conditionText:
      stringFrom(raw?.conditionText, raw?.condition, raw?.description) ??
      conditionTextFromCode(conditionCode),
    iconUrl: stringFrom(raw?.iconUrl, raw?.icon_url, raw?.icon),
    iconPath: stringFrom(raw?.iconPath, raw?.icon_path),
  };
}

function normalizeHourlyPoint(rawValue: unknown): HourlyForecastPoint {
  const raw = asRecord(rawValue);
  const conditionCode = stringFrom(raw?.conditionCode, raw?.condition_code);

  return {
    time: stringFrom(raw?.time, raw?.timestamp, raw?.dateTime) ?? "",
    temperatureC: numberFrom(raw?.temperatureC, raw?.tempC, raw?.temp_c, raw?.temperature),
    temperatureF: numberFrom(raw?.temperatureF, raw?.tempF, raw?.temp_f),
    feelsLikeC: numberFrom(raw?.feelsLikeC, raw?.feels_like_c, raw?.feels_like),
    feelsLikeF: numberFrom(raw?.feelsLikeF, raw?.feels_like_f),
    humidityPercent: numberFrom(raw?.humidityPercent, raw?.humidity, raw?.relativeHumidity),
    precipitationProbability: numberFrom(
      raw?.precipitationProbability,
      raw?.precipitation_probability,
      raw?.precipProbability,
      raw?.chanceOfRain,
      raw?.pop,
    ),
    rainfallMm: numberFrom(raw?.rainfallMm, raw?.precipMm, raw?.precip_mm, raw?.rain),
    windSpeedKph: numberFrom(
      raw?.windSpeedKph,
      raw?.wind_kph,
      raw?.windSpeed,
      raw?.wind_speed,
    ),
    windGustKph: numberFrom(raw?.windGustKph, raw?.gust_kph, raw?.windGust, raw?.wind_gust),
    uvIndex: numberFrom(raw?.uvIndex, raw?.uv_index),
    conditionCode,
    conditionText:
      stringFrom(raw?.conditionText, raw?.condition, raw?.description) ??
      conditionTextFromCode(conditionCode),
    iconUrl: stringFrom(raw?.iconUrl, raw?.icon_url, raw?.icon),
    iconPath: stringFrom(raw?.iconPath, raw?.icon_path),
  };
}

function normalizeDailyPoint(rawValue: unknown): DailyForecastPoint {
  const raw = asRecord(rawValue);
  const conditionCode = stringFrom(raw?.conditionCode, raw?.condition_code);

  return {
    date: stringFrom(raw?.date, raw?.day) ?? "",
    maxTemperatureC: numberFrom(
      raw?.maxTemperatureC,
      raw?.maxTempC,
      raw?.maxtemp_c,
      raw?.temp_max,
    ),
    minTemperatureC: numberFrom(
      raw?.minTemperatureC,
      raw?.minTempC,
      raw?.mintemp_c,
      raw?.temp_min,
    ),
    maxTemperatureF: numberFrom(raw?.maxTemperatureF, raw?.maxTempF, raw?.maxtemp_f),
    minTemperatureF: numberFrom(raw?.minTemperatureF, raw?.minTempF, raw?.mintemp_f),
    precipitationProbability: numberFrom(
      raw?.precipitationProbability,
      raw?.precipitation_probability,
      raw?.precipProbability,
      raw?.chanceOfRain,
      raw?.pop,
    ),
    rainfallMm: numberFrom(
      raw?.rainfallMm,
      raw?.precipMm,
      raw?.totalprecip_mm,
      raw?.precipitation_sum,
      raw?.rain,
    ),
    maxWindSpeedKph: numberFrom(raw?.maxWindSpeedKph, raw?.wind_max, raw?.maxwind_kph),
    sunrise: stringFrom(raw?.sunrise),
    sunset: stringFrom(raw?.sunset),
    conditionCode,
    conditionText:
      stringFrom(raw?.conditionText, raw?.condition, raw?.description) ??
      conditionTextFromCode(conditionCode),
    iconUrl: stringFrom(raw?.iconUrl, raw?.icon_url, raw?.icon),
    iconPath: stringFrom(raw?.iconPath, raw?.icon_path),
  };
}

function findNearestHourlyPoint(
  currentRaw: Record<string, unknown> | undefined,
  hourlyRaw: unknown[],
): Record<string, unknown> | undefined {
  const currentTime = stringFrom(currentRaw?.time, currentRaw?.timestamp, currentRaw?.dateTime);

  if (!currentTime) {
    return asRecord(hourlyRaw[0]);
  }

  const currentDate = new Date(currentTime);

  if (Number.isNaN(currentDate.getTime())) {
    return asRecord(hourlyRaw[0]);
  }

  let nearest: Record<string, unknown> | undefined;
  let nearestDelta = Number.POSITIVE_INFINITY;

  for (const rawValue of hourlyRaw) {
    const raw = asRecord(rawValue);
    const time = stringFrom(raw?.time, raw?.timestamp, raw?.dateTime);

    if (!raw || !time) {
      continue;
    }

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const delta = Math.abs(date.getTime() - currentDate.getTime());

    if (delta < nearestDelta) {
      nearest = raw;
      nearestDelta = delta;
    }
  }

  return nearest;
}

function conditionTextFromCode(code: string | undefined): string | undefined {
  switch (code) {
    case "0":
      return "Clear sky";
    case "1":
      return "Mainly clear";
    case "2":
      return "Partly cloudy";
    case "3":
      return "Overcast";
    case "45":
    case "48":
      return "Fog";
    case "51":
    case "53":
    case "55":
      return "Drizzle";
    case "61":
    case "63":
    case "65":
      return "Rain";
    case "71":
    case "73":
    case "75":
      return "Snow";
    case "80":
    case "81":
    case "82":
      return "Rain showers";
    case "95":
    case "96":
    case "99":
      return "Thunderstorm";
    default:
      return undefined;
  }
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
