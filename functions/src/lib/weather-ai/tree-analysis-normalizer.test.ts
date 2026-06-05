import { describe, expect, it } from "vitest";

import { normalizeWeatherAiTreeAnalysis } from "./tree-analysis-normalizer";

describe("normalizeWeatherAiTreeAnalysis", () => {
  it("normalizes WeatherAI-like tree payloads", () => {
    const analysis = normalizeWeatherAiTreeAnalysis(
      {
        data: {
          treeCount: "24",
          densityPerAcre: 12,
          canopyCoverage: 66,
          confidence: 0.91,
          species: "Mango",
          health: {
            healthy: 18,
            moderate: 4,
            poor: 2,
          },
          overlayUrl: "https://example.test/overlay.png",
          observations: ["Dense canopy"],
          recommendations: ["Inspect sparse edge"],
        },
      },
      {
        id: "analysis-1",
        createdAt: "2026-06-05T09:00:00.000Z",
      },
    );

    expect(analysis).toMatchObject({
      id: "analysis-1",
      totalTreeCount: 24,
      treeDensityPerAcre: 12,
      canopyCoveragePct: 66,
      confidenceScore: 0.91,
      speciesGuess: "Mango",
      overlayImageUrl: "https://example.test/overlay.png",
      observations: ["Dense canopy"],
      recommendations: ["Inspect sparse edge"],
      createdAt: "2026-06-05T09:00:00.000Z",
    });
  });

  it("tolerates missing optional fields", () => {
    expect(
      normalizeWeatherAiTreeAnalysis(
        {},
        {
          id: "analysis-1",
          createdAt: "2026-06-05T09:00:00.000Z",
        },
      ),
    ).toEqual({
      id: "analysis-1",
      observations: [],
      recommendations: [],
      createdAt: "2026-06-05T09:00:00.000Z",
    });
  });
});
