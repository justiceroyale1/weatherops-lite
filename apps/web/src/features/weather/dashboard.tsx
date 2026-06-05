import {
  AlertTriangle,
  CalendarDays,
  CloudRain,
  ListChecks,
  Thermometer,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDateTime,
  formatPercent,
  formatRainfall,
  formatTemperature,
  formatWind,
} from "@/lib/utils/formatters";
import type {
  DailyForecastPoint,
  HourlyForecastPoint,
  WeatherDashboardResponse,
  WeatherRequest,
} from "@/types/weather";

export function DashboardEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-44 flex-col justify-center gap-3 text-center">
        <p className="text-lg font-semibold">No field risk report yet</p>
        <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
          Select a saved location or enter coordinates to generate your first
          field risk report.
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardErrorState({ message }: { message: string }) {
  return (
    <Alert className="flex items-start gap-3">
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </Alert>
  );
}

export function DashboardReport({
  report,
  request,
}: {
  report: WeatherDashboardResponse;
  request: WeatherRequest;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <RiskScoreCard report={report} />
        <CurrentWeatherCard report={report} request={request} />
        <AiSummaryCard report={report} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <HourlyForecastChart hourly={report.hourly} request={request} />
        <DailyForecastChart daily={report.daily} request={request} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RiskFactorsList report={report} />
        <RecommendationsPanel report={report} />
      </div>
    </div>
  );
}

function RiskScoreCard({ report }: { report: WeatherDashboardResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-4xl font-bold">{report.risk.score} / 100</p>
          <RiskBadge level={report.risk.level} />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {report.risk.headline}
        </p>
        <p className="text-xs text-muted-foreground">
          Source: {report.source === "demo" ? "Demo fallback" : "WeatherAI"}
        </p>
      </CardContent>
    </Card>
  );
}

function CurrentWeatherCard({
  report,
  request,
}: {
  report: WeatherDashboardResponse;
  request: WeatherRequest;
}) {
  const temperature =
    request.units === "imperial"
      ? report.current.temperatureF
      : report.current.temperatureC;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Weather</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Thermometer aria-hidden="true" className="h-5 w-5 text-primary" />
          <p className="text-3xl font-bold">
            {formatTemperature(temperature, request.units)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Rain" value={formatPercent(report.current.precipitationProbability)} />
          <Metric label="Wind" value={formatWind(report.current.windSpeedKph)} />
          <Metric label="Rainfall" value={formatRainfall(report.current.rainfallMm)} />
          <Metric label="Humidity" value={formatPercent(report.current.humidityPercent)} />
        </dl>
        <p className="text-sm text-muted-foreground">
          {report.current.conditionText ?? "Condition not available"}
        </p>
      </CardContent>
    </Card>
  );
}

function AiSummaryCard({ report }: { report: WeatherDashboardResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {report.aiSummary ??
            "AI summary is disabled or unavailable for this report."}
        </p>
        <p className="text-xs text-muted-foreground">
          Fetched {formatDateTime(report.fetchedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

function HourlyForecastChart({
  hourly,
  request,
}: {
  hourly: HourlyForecastPoint[];
  request: WeatherRequest;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudRain aria-hidden="true" className="h-4 w-4" />
          Hourly Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hourly.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hourly forecast is not available.
            </p>
          ) : (
            hourly.slice(0, 8).map((point) => (
              <BarRow
                key={point.time}
                label={formatDateTime(point.time)}
                value={point.precipitationProbability ?? 0}
                detail={`${formatTemperature(
                  request.units === "imperial"
                    ? point.temperatureF
                    : point.temperatureC,
                  request.units,
                )} · ${formatWind(point.windSpeedKph)}`}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DailyForecastChart({
  daily,
  request,
}: {
  daily: DailyForecastPoint[];
  request: WeatherRequest;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="h-4 w-4" />
          Daily Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Daily forecast is not available.
            </p>
          ) : (
            daily.map((point) => {
              const maxTemp =
                request.units === "imperial"
                  ? point.maxTemperatureF
                  : point.maxTemperatureC;

              return (
                <BarRow
                  key={point.date}
                  label={point.date}
                  value={point.precipitationProbability ?? 0}
                  detail={`${formatTemperature(
                    maxTemp,
                    request.units,
                  )} · ${formatRainfall(point.rainfallMm)}`}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskFactorsList({ report }: { report: WeatherDashboardResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="h-4 w-4" />
          Risk Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        {report.risk.factors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No elevated risk factors detected.
          </p>
        ) : (
          <ul className="space-y-3">
            {report.risk.factors.map((factor) => (
              <li className="rounded-md border p-3" key={factor.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{factor.label}</p>
                  <RiskBadge level={factor.severity} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {factor.recommendation}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationsPanel({
  report,
}: {
  report: WeatherDashboardResponse;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks aria-hidden="true" className="h-4 w-4" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {report.risk.recommendations.map((item) => (
            <li className="rounded-md border p-3" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge>{item.priority} priority</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function BarRow({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: number;
}) {
  const width = Math.max(2, Math.min(100, value));

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-muted-foreground">{detail}</span>
      </div>
      <div
        aria-label={`${label} precipitation probability ${value}%`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const className =
    level === "Critical"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : level === "High"
        ? "border-amber-600/40 bg-amber-50 text-amber-800"
        : level === "Medium"
          ? "border-sky-600/40 bg-sky-50 text-sky-800"
          : "border-emerald-600/40 bg-emerald-50 text-emerald-800";

  return <Badge className={className}>{level}</Badge>;
}
