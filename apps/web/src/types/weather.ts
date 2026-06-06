export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface WeatherRequest {
  lat: number;
  lon: number;
  units: "metric" | "imperial";
  days: number;
  locationId?: string;
}

export interface RiskFactor {
  id: string;
  label: string;
  severity: RiskLevel;
  scoreImpact: number;
  metric?: string;
  observedValue?: number | string;
  recommendation: string;
}

export interface OperationalRecommendation {
  id: string;
  title: string;
  description: string;
  operationType:
    | "spraying"
    | "irrigation"
    | "harvesting"
    | "delivery"
    | "inspection"
    | "worker-safety"
    | "general";
  priority: "low" | "medium" | "high";
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  headline: string;
  factors: RiskFactor[];
  recommendations: OperationalRecommendation[];
}

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
