import type { RiskAssessment } from "../risk";

export interface WeatherLocation {
  lat: number;
  lon: number;
  timezone?: string;
  resolvedName?: string;
}

export interface CurrentWeather {
  temperatureC?: number;
  temperatureF?: number;
  humidityPercent?: number;
  windSpeedKph?: number;
  windGustKph?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  visibilityKm?: number;
  conditionText?: string;
}

export interface HourlyForecastPoint {
  time: string;
  temperatureC?: number;
  temperatureF?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  windSpeedKph?: number;
  conditionText?: string;
}

export interface DailyForecastPoint {
  date: string;
  maxTemperatureC?: number;
  minTemperatureC?: number;
  maxTemperatureF?: number;
  minTemperatureF?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  conditionText?: string;
}

export interface WeatherDashboardResponse {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  aiSummary?: string;
  risk: RiskAssessment;
  fetchedAt: string;
  source: "weatherai" | "demo";
}
