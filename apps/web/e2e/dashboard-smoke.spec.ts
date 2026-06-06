import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/locations", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: {
        locations: [
          {
            id: "demo-nairobi-kenya",
            name: "Nairobi, Kenya",
            type: "farm",
            lat: -1.286389,
            lon: 36.817223,
            lastRiskScore: 38,
            lastRiskLevel: "Medium",
            lastCheckedAt: "2026-06-05T09:00:00.000Z",
            createdAt: "2026-06-05T09:00:00.000Z",
            updatedAt: "2026-06-05T09:00:00.000Z",
          },
        ],
      },
    });
  });

  await page.route("**/usage", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        plan: "Demo",
        requestsUsed: 42,
        requestsLimit: 1_000,
        aiRequestsUsed: 7,
        aiRequestsLimit: 100,
        fetchedAt: "2026-06-05T09:00:00.000Z",
      },
    });
  });

  await page.route("**/treeAnalysis", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: {
        analyses: [],
      },
    });
  });

  await page.route("**/weather", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        location: {
          lat: 6.5244,
          lon: 3.3792,
          timezone: "Africa/Lagos",
          resolvedName: "Lagos, Nigeria",
        },
        current: {
          temperatureC: 29,
          temperatureF: 84.2,
          humidityPercent: 76,
          windSpeedKph: 18,
          precipitationProbability: 35,
          rainfallMm: 2.4,
          conditionText: "Partly cloudy",
        },
        hourly: [
          {
            time: "2026-06-05T09:00:00.000Z",
            temperatureC: 29,
            temperatureF: 84.2,
            precipitationProbability: 35,
            windSpeedKph: 18,
          },
        ],
        daily: [
          {
            date: "2026-06-05",
            maxTemperatureC: 31,
            minTemperatureC: 24,
            maxTemperatureF: 87.8,
            minTemperatureF: 75.2,
            precipitationProbability: 42,
            rainfallMm: 6.3,
          },
        ],
        risk: {
          score: 38,
          level: "Medium",
          headline: "Monitor rain and wind before scheduling field work.",
          factors: [
            {
              id: "rain-probability",
              label: "Rain probability",
              severity: "Medium",
              scoreImpact: 18,
              metric: "Precipitation probability",
              observedValue: 35,
              recommendation: "Keep crews ready to pause outdoor operations.",
            },
          ],
          recommendations: [
            {
              id: "spraying",
              title: "Schedule spraying around rain windows",
              description: "Avoid chemical application if rain develops.",
              operationType: "spraying",
              priority: "medium",
            },
            {
              id: "inspection",
              title: "Inspect exposed plots",
              description: "Prioritize checks on fields with poor drainage.",
              operationType: "inspection",
              priority: "medium",
            },
            {
              id: "delivery",
              title: "Keep delivery routes flexible",
              description: "Watch for short rain delays around peak activity.",
              operationType: "delivery",
              priority: "low",
            },
          ],
        },
        fetchedAt: "2026-06-05T09:00:00.000Z",
        source: "demo",
      },
    });
  });
});

test("renders the dashboard smoke path with mocked backend data", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WeatherOps Lite" })).toBeVisible();
  await expect(page.getByText("Nairobi, Kenya")).toBeVisible();
  await expect(page.getByText("Demo")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tree Analysis" })).toBeVisible();

  await page.getByRole("button", { name: /generate report/i }).click();

  await expect(page.getByRole("heading", { name: "Risk Score" })).toBeVisible();
  await expect(page.getByText("38 / 100")).toBeVisible();
  await expect(page.getByText("Current Weather")).toBeVisible();
  await expect(page.getByText("AI Summary")).not.toBeVisible();
  await expect(page.getByText("Schedule spraying around rain windows")).toBeVisible();
});
