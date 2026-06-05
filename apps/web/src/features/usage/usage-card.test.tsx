import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { UsageCard } from "./usage-card";

describe("UsageCard", () => {
  it("renders usage data", async () => {
    renderWithQueryClient(
      <UsageCard />,
      async () => jsonResponse({
        plan: "Free",
        requestsUsed: 25,
        requestsLimit: 100,
        aiRequestsUsed: 5,
        aiRequestsLimit: 20,
        periodStart: "2026-06-01T00:00:00.000Z",
        periodEnd: "2026-06-30T23:59:59.000Z",
        fetchedAt: "2026-06-05T09:00:00.000Z",
      }),
    );

    expect(await screen.findByText("Free")).toBeVisible();
    expect(screen.getByText("API Usage")).toBeVisible();
    expect(screen.getByText("25 / 100")).toBeVisible();
    expect(screen.getByText("5 / 20")).toBeVisible();
    expect(screen.getByText(/Disable AI summaries/i)).toBeVisible();
  });

  it("renders fallback state when usage fails", async () => {
    renderWithQueryClient(
      <UsageCard />,
      async () =>
        jsonResponse(
          {
            code: "SERVICE_UNAVAILABLE",
            message: "WeatherAI is temporarily unavailable.",
          },
          503,
        ),
    );

    expect(await screen.findByText("WeatherAI is temporarily unavailable.")).toBeVisible();
    expect(screen.getByText("Usage unavailable")).toBeVisible();
  });
});

function renderWithQueryClient(
  children: ReactNode,
  fetchImpl: typeof fetch,
) {
  vi.stubGlobal("fetch", fetchImpl);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
