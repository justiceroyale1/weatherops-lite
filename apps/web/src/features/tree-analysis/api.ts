import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  TreeAnalysisMetadata,
  TreeAnalysisResponse,
} from "@/types/tree-analysis";

interface TreeAnalysisHistoryResponse {
  analyses: TreeAnalysisResponse[];
}

export interface TreeAnalysisRequest extends TreeAnalysisMetadata {
  image: File;
}

const queryKey = ["tree-analysis-history"];

export function fetchTreeAnalysisHistory(): Promise<TreeAnalysisHistoryResponse> {
  return apiClient.get<TreeAnalysisHistoryResponse>("/treeAnalysis");
}

export function submitTreeAnalysis(
  input: TreeAnalysisRequest,
): Promise<TreeAnalysisResponse> {
  const formData = new FormData();
  formData.set("image", input.image);

  if (input.locationName) {
    formData.set("locationName", input.locationName);
  }

  if (input.landAcres !== undefined) {
    formData.set("landAcres", String(input.landAcres));
  }

  if (input.notes) {
    formData.set("notes", input.notes);
  }

  return apiClient.postForm<TreeAnalysisResponse>("/treeAnalysis", formData);
}

export function useTreeAnalysisHistoryQuery() {
  return useQuery({
    queryKey,
    queryFn: fetchTreeAnalysisHistory,
  });
}

export function useTreeAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTreeAnalysis,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
