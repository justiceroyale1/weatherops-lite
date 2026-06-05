import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TreeAnalysisPanel } from "./tree-analysis-panel";

describe("TreeAnalysisPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders upload empty state and history", async () => {
    renderWithQueryClient(<TreeAnalysisPanel />);

    expect(screen.getByText("Tree Analysis")).toBeVisible();
    expect(screen.getByText(/Upload a JPEG, PNG, or WebP image/i)).toBeVisible();
    expect(await screen.findByText(/Jun 5/)).toBeVisible();
    expect(screen.getByText("24 trees")).toBeVisible();
  });

  it("shows validation errors for invalid files", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TreeAnalysisPanel />);

    fireEvent.change(screen.getByLabelText("Farm image"), {
      target: {
        files: [new File(["x"], "field.txt", { type: "text/plain" })],
      },
    });
    await user.click(screen.getByRole("button", { name: /analyze image/i }));

    expect(await screen.findByText("Image must be JPEG, PNG, or WebP.")).toBeVisible();
  });

  it("submits valid files and renders results", async () => {
    const user = userEvent.setup();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    renderWithQueryClient(<TreeAnalysisPanel />);

    await user.upload(
      screen.getByLabelText("Farm image"),
      new File(["image"], "field.png", { type: "image/png" }),
    );
    expect(await screen.findByAltText("Selected farm preview")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /analyze image/i }));

    expect(await screen.findByText("Latest analysis")).toBeVisible();
    expect(screen.getByText("Dense canopy")).toBeVisible();
    expect(screen.getByText("Inspect sparse edge")).toBeVisible();
  });
});

function renderWithQueryClient(children: ReactNode) {
  vi.stubGlobal("fetch", (async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return jsonResponse({
        id: "analysis-2",
        totalTreeCount: 44,
        canopyCoveragePct: 66,
        confidenceScore: 0.91,
        observations: ["Dense canopy"],
        recommendations: ["Inspect sparse edge"],
        createdAt: "2026-06-05T09:00:00.000Z",
      }, 201);
    }

    return jsonResponse({
      analyses: [
        {
          id: "analysis-1",
          totalTreeCount: 24,
          observations: ["History observation"],
          recommendations: ["History recommendation"],
          createdAt: "2026-06-05T09:00:00.000Z",
        },
      ],
    });
  }) as typeof fetch);

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
