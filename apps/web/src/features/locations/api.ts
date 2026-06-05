import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  CreateLocationRequest,
  LocationProfile,
} from "@/types/location";

interface LocationsResponse {
  locations: LocationProfile[];
}

const queryKey = ["locations"];

export function fetchLocations(): Promise<LocationsResponse> {
  return apiClient.get<LocationsResponse>("/locations");
}

export function createLocation(
  input: CreateLocationRequest,
): Promise<LocationProfile> {
  return apiClient.post<LocationProfile>("/locations", input);
}

export function deleteLocation(id: string): Promise<void> {
  return apiClient.delete("/locations", { id });
}

export function useLocationsQuery() {
  return useQuery({
    queryKey,
    queryFn: fetchLocations,
  });
}

export function useCreateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
