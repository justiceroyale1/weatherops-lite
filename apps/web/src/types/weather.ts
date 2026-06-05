export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface WeatherRequest {
  lat: number;
  lon: number;
  units: "metric" | "imperial";
  days: number;
  includeAi: boolean;
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
