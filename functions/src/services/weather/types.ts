import type { RiskAssessment } from "../risk";

export interface WeatherLocation {
  lat: number;
  lon: number;
  requestedLat?: number;
  requestedLon?: number;
  timezone?: string;
  resolvedName?: string;
  country?: string;
}

export interface CurrentWeather {
  time?: string;
  temperatureC?: number;
  temperatureF?: number;
  feelsLikeC?: number;
  feelsLikeF?: number;
  humidityPercent?: number;
  windSpeedKph?: number;
  windGustKph?: number;
  windDirectionDegrees?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  visibilityKm?: number;
  uvIndex?: number;
  conditionCode?: string;
  conditionText?: string;
  iconUrl?: string;
  iconPath?: string;
}

export interface HourlyForecastPoint {
  time: string;
  temperatureC?: number;
  temperatureF?: number;
  feelsLikeC?: number;
  feelsLikeF?: number;
  humidityPercent?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  windSpeedKph?: number;
  windGustKph?: number;
  uvIndex?: number;
  conditionCode?: string;
  conditionText?: string;
  iconUrl?: string;
  iconPath?: string;
}

export interface DailyForecastPoint {
  date: string;
  maxTemperatureC?: number;
  minTemperatureC?: number;
  maxTemperatureF?: number;
  minTemperatureF?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  maxWindSpeedKph?: number;
  sunrise?: string;
  sunset?: string;
  conditionCode?: string;
  conditionText?: string;
  iconUrl?: string;
  iconPath?: string;
}

export interface WeatherDashboardResponse {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  risk: RiskAssessment;
  fetchedAt: string;
  source: "weatherai" | "demo";
}
