import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SavedLocationsPanel } from "./saved-locations-panel";
import type { LocationProfile } from "@/types/location";

describe("SavedLocationsPanel", () => {
  it("renders default saved locations", async () => {
    renderWithQueryClient(<SavedLocationsPanel isRefreshing={false} onUseLocation={vi.fn()} />);

    expect(await screen.findByText("Nairobi, Kenya")).toBeVisible();
    expect(screen.getByText("Abuja, Nigeria")).toBeVisible();
  });

  it("shows validation errors and does not submit invalid locations", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SavedLocationsPanel isRefreshing={false} onUseLocation={vi.fn()} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "N");
    await user.clear(screen.getByLabelText("Latitude"));
    await user.type(screen.getByLabelText("Latitude"), "-91");
    await user.clear(screen.getByLabelText("Longitude"));
    await user.type(screen.getByLabelText("Longitude"), "181");
    await user.click(screen.getByRole("button", { name: /save location/i }));

    expect(await screen.findByText("Name must be at least 2 characters.")).toBeVisible();
    expect(screen.getByText("Latitude must be between -90 and 90.")).toBeVisible();
    expect(screen.getByText("Longitude must be between -180 and 180.")).toBeVisible();
  });

  it("creates a location and refreshes the list", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SavedLocationsPanel isRefreshing={false} onUseLocation={vi.fn()} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "North Farm");
    await user.clear(screen.getByLabelText("Latitude"));
    await user.type(screen.getByLabelText("Latitude"), "9.1");
    await user.clear(screen.getByLabelText("Longitude"));
    await user.type(screen.getByLabelText("Longitude"), "7.4");
    await user.click(screen.getByRole("button", { name: /save location/i }));

    expect(await screen.findByText("North Farm")).toBeVisible();
  });

  it("uses and deletes saved locations", async () => {
    const user = userEvent.setup();
    const onUseLocation = vi.fn();
    renderWithQueryClient(
      <SavedLocationsPanel isRefreshing={false} onUseLocation={onUseLocation} />,
    );

    await screen.findByText("Nairobi, Kenya");
    await user.click(screen.getAllByRole("button", { name: /refresh/i })[0]);

    expect(onUseLocation).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nairobi, Kenya" }),
    );

    await user.click(screen.getByRole("button", { name: /delete nairobi/i }));

    await waitFor(() => {
      expect(screen.queryByText("Nairobi, Kenya")).not.toBeInTheDocument();
    });
  });
});

function renderWithQueryClient(children: ReactNode) {
  const locations: LocationProfile[] = [
    {
      id: "demo-nairobi-kenya",
      name: "Nairobi, Kenya",
      type: "farm",
      lat: -1.286389,
      lon: 36.817223,
      createdAt: "2026-06-05T09:00:00.000Z",
      updatedAt: "2026-06-05T09:00:00.000Z",
    },
    {
      id: "demo-abuja-nigeria",
      name: "Abuja, Nigeria",
      type: "farm",
      lat: 9.076479,
      lon: 7.398574,
      lastRiskScore: 42,
      lastRiskLevel: "Medium",
      lastCheckedAt: "2026-06-05T09:00:00.000Z",
      createdAt: "2026-06-05T09:00:00.000Z",
      updatedAt: "2026-06-05T09:00:00.000Z",
    },
  ];

  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as {
        lat: number;
        lon: number;
        name: string;
        type: string;
      };
      locations.push({
        id: "created-location",
        name: body.name,
        type: "farm",
        lat: body.lat,
        lon: body.lon,
        createdAt: "2026-06-05T09:00:00.000Z",
        updatedAt: "2026-06-05T09:00:00.000Z",
      });

      return jsonResponse(locations[locations.length - 1], 201);
    }

    if (init?.method === "DELETE") {
      const body = JSON.parse(String(init.body)) as { id: string };
      const index = locations.findIndex((location) => location.id === body.id);
      if (index >= 0) {
        locations.splice(index, 1);
      }

      return jsonResponse(undefined, 204);
    }

    return jsonResponse({ locations });
  });
  vi.stubGlobal("fetch", fetchMock);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
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
