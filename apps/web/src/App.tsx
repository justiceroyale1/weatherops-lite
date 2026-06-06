import { useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";

import { SavedLocationsPanel } from "@/features/locations/saved-locations-panel";
import { UsageCard } from "@/features/usage/usage-card";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardReport,
} from "@/features/weather/dashboard";
import { useWeatherReportMutation } from "@/features/weather/api";
import { WeatherForm } from "@/features/weather/weather-form";
import type { WeatherFormValues } from "@/lib/validations/weather";
import type { LocationProfile } from "@/types/location";
import type { WeatherRequest } from "@/types/weather";

const TreeAnalysisPanel = lazy(() =>
  import("@/features/tree-analysis/tree-analysis-panel").then((module) => ({
    default: module.TreeAnalysisPanel,
  })),
);

export function App() {
  const [lastRequest, setLastRequest] = useState<WeatherRequest>({
    lat: 6.5244,
    lon: 3.3792,
    units: "metric",
    days: 3,
  });
  const queryClient = useQueryClient();
  const weatherReport = useWeatherReportMutation();

  function handleSubmit(values: WeatherFormValues) {
    const request: WeatherRequest = {
      lat: values.lat,
      lon: values.lon,
      units: values.units,
      days: values.days,
    };

    setLastRequest(request);
    weatherReport.mutate(request, {
      onSuccess: async () => {
        if (request.locationId) {
          await queryClient.invalidateQueries({ queryKey: ["locations"] });
        }
      },
    });
  }

  function handleUseLocation(location: LocationProfile) {
    const request: WeatherRequest = {
      lat: location.lat,
      lon: location.lon,
      units: lastRequest.units,
      days: lastRequest.days,
      locationId: location.id,
    };

    setLastRequest(request);
    weatherReport.mutate(request, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["locations"] });
      },
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Weather intelligence for field operations
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal">
              WeatherOps Lite
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Generate a weather risk report for field work, crew scheduling,
              inspections, delivery routes, and daily farm operations.
            </p>
          </div>
          <div className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            Active location: {lastRequest.lat.toFixed(4)},{" "}
            {lastRequest.lon.toFixed(4)}
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.25fr]">
          <div className="space-y-4">
            <SavedLocationsPanel
              isRefreshing={weatherReport.isPending}
              onUseLocation={handleUseLocation}
            />
            <UsageCard />
          </div>
          <WeatherForm
            isSubmitting={weatherReport.isPending}
            onSubmit={handleSubmit}
          />
        </div>

        {weatherReport.isError ? (
          <DashboardErrorState
            message={
              weatherReport.error instanceof Error
                ? weatherReport.error.message
                : "The weather report could not be loaded."
            }
          />
        ) : null}

        {weatherReport.isPending ? <DashboardLoadingState /> : null}

        {!weatherReport.isPending && weatherReport.data ? (
          <DashboardReport report={weatherReport.data} request={lastRequest} />
        ) : null}

        {!weatherReport.isPending &&
        !weatherReport.data &&
        !weatherReport.isError ? (
          <DashboardEmptyState />
        ) : null}

        <Suspense fallback={<TreeAnalysisLoadingState />}>
          <TreeAnalysisPanel />
        </Suspense>
      </div>
    </main>
  );
}

function TreeAnalysisLoadingState() {
  return (
    <section
      aria-label="Tree analysis loading"
      className="rounded-lg border bg-card p-6 text-sm text-muted-foreground"
    >
      Loading tree analysis...
    </section>
  );
}

export default App;
