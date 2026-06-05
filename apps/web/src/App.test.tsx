import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("keeps dashboard controls available when usage fails", async () => {
    vi.stubGlobal("fetch", (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/usage")) {
        return jsonResponse(
          {
            code: "SERVICE_UNAVAILABLE",
            message: "WeatherAI is temporarily unavailable.",
          },
          503,
        );
      }

      if (url.endsWith("/locations")) {
        return jsonResponse({
          locations: [
            {
              id: "demo-nairobi-kenya",
              name: "Nairobi, Kenya",
              type: "farm",
              lat: -1.286389,
              lon: 36.817223,
              createdAt: "2026-06-05T09:00:00.000Z",
              updatedAt: "2026-06-05T09:00:00.000Z",
            },
          ],
        });
      }

      return jsonResponse({});
    }) as typeof fetch);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("WeatherAI is temporarily unavailable.")).toBeVisible();
    expect(screen.getByText("Nairobi, Kenya")).toBeVisible();
    expect(screen.getByRole("button", { name: /generate report/i })).toBeVisible();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
