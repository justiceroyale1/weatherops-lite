import { describe, expect, it } from "vitest";

import type { RuntimeConfig } from "../../config";
import type { TreeAnalysisMetadata } from "../../schemas";
import {
  TreeAnalysisService,
  type TreeAnalysisDataClient,
  type TreeAnalysisRepository,
} from ".";
import type { TreeAnalysisResponse } from "./types";

const baseConfig: RuntimeConfig = {
  allowedOrigins: ["http://localhost:5173"],
  enableDemoMode: false,
  weatherAiBaseUrl: "https://api.weather-ai.co",
};

describe("TreeAnalysisService", () => {
  it("returns and stores demo fallback when demo mode is enabled", async () => {
    const repository = new InMemoryTreeAnalysisRepository();
    const service = new TreeAnalysisService({
      config: {
        ...baseConfig,
        enableDemoMode: true,
      },
      now: () => new Date("2026-06-05T09:00:00.000Z"),
      repository,
      uuid: () => "analysis-1",
    });

    const analysis = await service.analyze({
      file: createFile(),
      locationName: "North Farm",
    });

    expect(analysis.id).toBe("analysis-1");
    expect(analysis.observations[0]).toContain("Demo fallback");
    expect(await service.listHistory()).toEqual([analysis]);
  });

  it("normalizes WeatherAI results and stores them", async () => {
    const repository = new InMemoryTreeAnalysisRepository();
    const client: TreeAnalysisDataClient = {
      async analyzeTrees() {
        return {
          treeCount: 44,
          observations: ["Canopy looks healthy"],
          recommendations: ["Schedule follow-up"],
        };
      },
    };
    const service = new TreeAnalysisService({
      client,
      config: {
        ...baseConfig,
        weatherAiApiKey: "test-secret",
      },
      now: () => new Date("2026-06-05T09:00:00.000Z"),
      repository,
      uuid: () => "analysis-2",
    });

    const analysis = await service.analyze({
      file: createFile(),
      landAcres: 2,
    });

    expect(analysis).toMatchObject({
      id: "analysis-2",
      totalTreeCount: 44,
      observations: ["Canopy looks healthy"],
      recommendations: ["Schedule follow-up"],
    });
    expect(await service.listHistory()).toEqual([analysis]);
  });
});

class InMemoryTreeAnalysisRepository implements TreeAnalysisRepository {
  private analyses: TreeAnalysisResponse[] = [];

  async create(
    analysis: TreeAnalysisResponse,
    _metadata: TreeAnalysisMetadata,
  ): Promise<TreeAnalysisResponse> {
    this.analyses.unshift(analysis);
    return analysis;
  }

  async list(): Promise<TreeAnalysisResponse[]> {
    return this.analyses;
  }
}

function createFile() {
  return {
    buffer: Buffer.alloc(128),
    contentType: "image/png",
    filename: "field.png",
    size: 128,
  };
}
