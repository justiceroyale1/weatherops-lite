import type { TreeAnalysisResponse } from "./types";

export function createDemoTreeAnalysis(
  id: string,
  createdAt: string,
): TreeAnalysisResponse {
  return {
    id,
    totalTreeCount: 184,
    treeDensityPerAcre: 31,
    canopyCoveragePct: 62,
    confidenceScore: 0.88,
    speciesGuess: "Mixed orchard canopy",
    healthBreakdown: {
      healthy: 128,
      moderate: 42,
      poor: 8,
      unknown: 6,
    },
    observations: [
      "Demo fallback: canopy coverage is moderate to high across the image.",
      "Tree spacing appears generally consistent with a few sparse zones.",
      "Several canopy patches should be inspected for stress or gaps.",
    ],
    recommendations: [
      "Use this demo result for workflow review only; confirm findings with WeatherAI analysis in production.",
      "Prioritize field inspection around sparse canopy zones.",
      "Compare future uploads from the same location to track canopy changes.",
    ],
    createdAt,
  };
}
