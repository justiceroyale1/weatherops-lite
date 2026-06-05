import type { WeatherRequest } from "@/types/weather";

export function formatNumber(value: number | undefined, suffix = ""): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return `${Math.round(value)}${suffix}`;
}

export function formatTemperature(
  value: number | undefined,
  units: WeatherRequest["units"],
): string {
  return formatNumber(value, units === "imperial" ? "F" : "C");
}

export function formatPercent(value: number | undefined): string {
  return formatNumber(value, "%");
}

export function formatWind(value: number | undefined): string {
  return formatNumber(value, " kph");
}

export function formatRainfall(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} mm`;
}

export function formatDateTime(value: string): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
