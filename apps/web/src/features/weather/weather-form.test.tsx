import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WeatherForm } from "./weather-form";

describe("WeatherForm", () => {
  it("shows validation errors and does not submit invalid values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<WeatherForm isSubmitting={false} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText("Latitude"));
    await user.type(screen.getByLabelText("Latitude"), "91");
    await user.clear(screen.getByLabelText("Longitude"));
    await user.type(screen.getByLabelText("Longitude"), "-181");
    await user.clear(screen.getByLabelText("Forecast days"));
    await user.type(screen.getByLabelText("Forecast days"), "8");
    await user.click(screen.getByRole("button", { name: /generate report/i }));

    expect(
      await screen.findByText("Latitude must be between -90 and 90."),
    ).toBeVisible();
    expect(
      screen.getByText("Longitude must be between -180 and 180."),
    ).toBeVisible();
    expect(
      screen.getByText("Forecast days cannot be more than 7."),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<WeatherForm isSubmitting={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /generate report/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0][0]).toEqual({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 3,
    });
  });

  it("does not show unavailable AI summary controls", () => {
    render(<WeatherForm isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.queryByLabelText(/AI summary/i)).not.toBeInTheDocument();
  });

  it("disables submit while loading", () => {
    render(<WeatherForm isSubmitting={true} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: /generate report/i })).toBeDisabled();
  });
});
