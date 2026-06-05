import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  WeatherDashboardResponse,
  WeatherRequest,
} from "@/types/weather";

export function fetchWeatherReport(
  input: WeatherRequest,
): Promise<WeatherDashboardResponse> {
  return apiClient.post<WeatherDashboardResponse>("/weather", input);
}

export function useWeatherReportMutation() {
  return useMutation({
    mutationFn: fetchWeatherReport,
  });
}
