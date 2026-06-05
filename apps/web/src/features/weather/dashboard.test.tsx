import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardReport,
} from "./dashboard";
import type { WeatherDashboardResponse, WeatherRequest } from "@/types/weather";

const request: WeatherRequest = {
  lat: 6.5244,
  lon: 3.3792,
  units: "metric",
  days: 3,
  includeAi: true,
};

const report: WeatherDashboardResponse = {
  location: {
    lat: 6.5244,
    lon: 3.3792,
    resolvedName: "Demo Field Site",
  },
  current: {
    temperatureC: 34,
    humidityPercent: 68,
    windSpeedKph: 24,
    precipitationProbability: 55,
    rainfallMm: 2,
    conditionText: "Rain showers",
  },
  hourly: [
    {
      time: "2026-06-05T08:00:00Z",
      temperatureC: 29,
      precipitationProbability: 20,
      windSpeedKph: 16,
    },
  ],
  daily: [
    {
      date: "2026-06-05",
      maxTemperatureC: 34,
      minTemperatureC: 22,
      precipitationProbability: 65,
      rainfallMm: 9,
    },
  ],
  aiSummary: "Warm, humid field conditions with rain risk later today.",
  risk: {
    score: 55,
    level: "High",
    headline: "Adjust schedules and prepare mitigation.",
    factors: [
      {
        id: "heavy-rain-probability",
        label: "Heavy rain probability",
        severity: "Medium",
        scoreImpact: 25,
        recommendation: "Delay spraying and harvesting windows.",
      },
    ],
    recommendations: [
      {
        id: "adjust-rain-sensitive-work",
        title: "Adjust rain-sensitive work",
        description: "Delay spraying and harvesting windows.",
        operationType: "harvesting",
        priority: "high",
      },
    ],
  },
  fetchedAt: "2026-06-05T08:00:00.000Z",
  source: "demo",
};

describe("dashboard states", () => {
  it("renders the empty state", () => {
    render(<DashboardEmptyState />);

    expect(screen.getByText(/No field risk report yet/i)).toBeVisible();
    expect(screen.getByText(/generate your first field risk report/i)).toBeVisible();
  });

  it("renders loading placeholders", () => {
    render(<DashboardLoadingState />);

    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders visible error alerts", () => {
    render(<DashboardErrorState message="API quota or rate limit reached." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "API quota or rate limit reached.",
    );
  });

  it("renders successful weather report sections", () => {
    render(<DashboardReport report={report} request={request} />);

    expect(screen.getByText("Risk Score")).toBeVisible();
    expect(screen.getByText("55 / 100")).toBeVisible();
    expect(screen.getAllByText("High")[0]).toBeVisible();
    expect(screen.getByText("Current Weather")).toBeVisible();
    expect(screen.getByText("AI Summary")).toBeVisible();
    expect(screen.getByText("Hourly Forecast")).toBeVisible();
    expect(screen.getByText("Daily Forecast")).toBeVisible();
    expect(screen.getByText("Risk Factors")).toBeVisible();
    expect(screen.getByText("Recommendations")).toBeVisible();
    expect(screen.getByText("Adjust rain-sensitive work")).toBeVisible();
  });

  it("shows AI fallback when AI summary is missing", () => {
    render(
      <DashboardReport
        report={{
          ...report,
          aiSummary: undefined,
        }}
        request={request}
      />,
    );

    expect(screen.getByText(/AI summary is disabled or unavailable/i)).toBeVisible();
  });
});
