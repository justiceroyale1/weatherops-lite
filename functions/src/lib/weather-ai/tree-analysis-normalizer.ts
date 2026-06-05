import type { TreeAnalysisResponse } from "../../services/tree-analysis/types";

export interface TreeAnalysisNormalizerOptions {
  createdAt: string;
  id: string;
}

export function normalizeWeatherAiTreeAnalysis(
  raw: unknown,
  options: TreeAnalysisNormalizerOptions,
): TreeAnalysisResponse {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? asRecord(root.analysis) ?? root;
  const health = asRecord(data.healthBreakdown) ?? asRecord(data.health);

  return {
    id: options.id,
    ...(numberFrom(data.totalTreeCount, data.treeCount, data.trees)
      !== undefined
      ? { totalTreeCount: numberFrom(data.totalTreeCount, data.treeCount, data.trees) }
      : {}),
    ...(numberFrom(data.treeDensityPerAcre, data.densityPerAcre)
      !== undefined
      ? { treeDensityPerAcre: numberFrom(data.treeDensityPerAcre, data.densityPerAcre) }
      : {}),
    ...(numberFrom(data.canopyCoveragePct, data.canopyCoverage, data.canopyPercent)
      !== undefined
      ? { canopyCoveragePct: numberFrom(data.canopyCoveragePct, data.canopyCoverage, data.canopyPercent) }
      : {}),
    ...(numberFrom(data.confidenceScore, data.confidence)
      !== undefined
      ? { confidenceScore: numberFrom(data.confidenceScore, data.confidence) }
      : {}),
    ...(stringFrom(data.speciesGuess, data.species) ? { speciesGuess: stringFrom(data.speciesGuess, data.species) } : {}),
    ...(health ? {
      healthBreakdown: {
        ...(numberFrom(health.healthy) !== undefined ? { healthy: numberFrom(health.healthy) } : {}),
        ...(numberFrom(health.moderate) !== undefined ? { moderate: numberFrom(health.moderate) } : {}),
        ...(numberFrom(health.poor) !== undefined ? { poor: numberFrom(health.poor) } : {}),
        ...(numberFrom(health.unknown) !== undefined ? { unknown: numberFrom(health.unknown) } : {}),
      },
    } : {}),
    ...(stringFrom(data.originalImageUrl, data.imageUrl) ? { originalImageUrl: stringFrom(data.originalImageUrl, data.imageUrl) } : {}),
    ...(stringFrom(data.overlayImageUrl, data.overlayUrl) ? { overlayImageUrl: stringFrom(data.overlayImageUrl, data.overlayUrl) } : {}),
    observations: stringArrayFrom(data.observations, data.insights),
    recommendations: stringArrayFrom(data.recommendations, data.actions),
    createdAt: options.createdAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function numberFrom(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function stringFrom(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return undefined;
}

function stringArrayFrom(...values: unknown[]): string[] {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
  }

  return [];
}
