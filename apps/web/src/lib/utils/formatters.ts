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

export function formatQuotaValue(
  used: number | undefined,
  limit: number | undefined,
): string {
  if (used === undefined || !Number.isFinite(used)) {
    return "Usage unavailable";
  }

  if (limit === undefined || !Number.isFinite(limit) || limit <= 0) {
    return `${Math.round(used)} used`;
  }

  return `${Math.round(used)} / ${Math.round(limit)}`;
}

export function getProgressPercent(
  used: number | undefined,
  limit: number | undefined,
): number {
  if (
    used === undefined ||
    limit === undefined ||
    !Number.isFinite(used) ||
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}
