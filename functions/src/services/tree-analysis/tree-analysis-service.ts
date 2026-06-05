import { randomUUID } from "node:crypto";

import type { RuntimeConfig } from "../../config";
import { WeatherAiClient } from "../../lib/weather-ai";
import { normalizeWeatherAiTreeAnalysis } from "../../lib/weather-ai/tree-analysis-normalizer";
import type { TreeAnalysisMetadata } from "../../schemas";
import { createDemoTreeAnalysis } from "./demo-tree-analysis";
import {
  FirestoreTreeAnalysisRepository,
  type TreeAnalysisRepository,
} from "./tree-analysis-repository";
import type { TreeAnalysisFile, TreeAnalysisInput, TreeAnalysisResponse } from "./types";
import { validateTreeAnalysisFile } from "./file-validation";

export interface TreeAnalysisDataClient {
  analyzeTrees(file: TreeAnalysisFile, metadata: TreeAnalysisMetadata): Promise<unknown>;
}

export interface TreeAnalysisServiceOptions {
  client?: TreeAnalysisDataClient;
  config: RuntimeConfig;
  now?: () => Date;
  repository?: TreeAnalysisRepository;
  uuid?: () => string;
}

export class TreeAnalysisService {
  private readonly client?: TreeAnalysisDataClient;
  private readonly config: RuntimeConfig;
  private readonly now: () => Date;
  private readonly repository: TreeAnalysisRepository;
  private readonly uuid: () => string;

  constructor(options: TreeAnalysisServiceOptions) {
    this.client = options.client;
    this.config = options.config;
    this.now = options.now ?? (() => new Date());
    this.repository = options.repository ?? new FirestoreTreeAnalysisRepository();
    this.uuid = options.uuid ?? randomUUID;
  }

  async analyze(input: TreeAnalysisInput): Promise<TreeAnalysisResponse> {
    validateTreeAnalysisFile(input.file);

    const id = this.uuid();
    const createdAt = this.now().toISOString();
    const metadata = {
      ...(input.locationName ? { locationName: input.locationName } : {}),
      ...(input.landAcres !== undefined ? { landAcres: input.landAcres } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    };
    const useDemo = this.config.enableDemoMode || !this.config.weatherAiApiKey;
    const analysis = useDemo
      ? createDemoTreeAnalysis(id, createdAt)
      : normalizeWeatherAiTreeAnalysis(
          await this.getClient().analyzeTrees(input.file, metadata),
          { id, createdAt },
        );

    return this.repository.create(analysis, metadata);
  }

  async listHistory(): Promise<TreeAnalysisResponse[]> {
    return this.repository.list();
  }

  private getClient(): TreeAnalysisDataClient {
    return this.client ?? new WeatherAiClient({
      apiKey: this.config.weatherAiApiKey ?? "",
      baseUrl: this.config.weatherAiBaseUrl,
    });
  }
}

export function createTreeAnalysisService(
  config: RuntimeConfig,
): TreeAnalysisService {
  return new TreeAnalysisService({ config });
}
