import type { RuntimeConfig } from "../../config";
import { WeatherAiClient } from "../../lib/weather-ai";
import { normalizeWeatherAiUsage } from "../../lib/weather-ai/usage-normalizer";
import { createDemoUsagePayload } from "./demo-usage";
import type { ApiUsageResponse } from "./types";

export interface UsageDataClient {
  getUsage(): Promise<unknown>;
}

export interface UsageServiceOptions {
  client?: UsageDataClient;
  config: RuntimeConfig;
  now?: () => Date;
}

export class UsageService {
  private readonly client?: UsageDataClient;
  private readonly config: RuntimeConfig;
  private readonly now: () => Date;

  constructor(options: UsageServiceOptions) {
    this.client = options.client;
    this.config = options.config;
    this.now = options.now ?? (() => new Date());
  }

  async getUsage(): Promise<ApiUsageResponse> {
    const useDemo = this.config.enableDemoMode || !this.config.weatherAiApiKey;
    const raw = useDemo
      ? createDemoUsagePayload()
      : await this.getClient().getUsage();

    return normalizeWeatherAiUsage(raw, {
      fetchedAt: this.now().toISOString(),
    });
  }

  private getClient(): UsageDataClient {
    return this.client ?? new WeatherAiClient({
      apiKey: this.config.weatherAiApiKey ?? "",
      baseUrl: this.config.weatherAiBaseUrl,
    });
  }
}

export function createUsageService(config: RuntimeConfig): UsageService {
  return new UsageService({ config });
}
