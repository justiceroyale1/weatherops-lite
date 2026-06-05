import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { ApiUsageResponse } from "@/types/usage";

export function fetchUsage(): Promise<ApiUsageResponse> {
  return apiClient.get<ApiUsageResponse>("/usage");
}

export function useUsageQuery() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: fetchUsage,
    retry: false,
  });
}
