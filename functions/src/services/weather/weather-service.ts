import type { RuntimeConfig } from "../../config";
import { WeatherAiClient } from "../../lib/weather-ai";
import { normalizeWeatherAiWeather } from "../../lib/weather-ai/weather-normalizer";
import type { WeatherRequest } from "../../schemas";
import { calculateRisk } from "../risk";
import { createDemoWeatherPayload } from "./demo-weather";
import type { WeatherDashboardResponse } from "./types";

export interface WeatherServiceOptions {
  config: RuntimeConfig;
  client?: WeatherDataClient;
  now?: () => Date;
}

export interface WeatherDataClient {
  getWeather(input: WeatherRequest): Promise<unknown>;
}

export class WeatherService {
  private readonly config: RuntimeConfig;
  private readonly client?: WeatherDataClient;
  private readonly now: () => Date;

  constructor(options: WeatherServiceOptions) {
    this.config = options.config;
    this.client = options.client;
    this.now = options.now ?? (() => new Date());
  }

  async getDashboardWeather(
    input: WeatherRequest,
  ): Promise<WeatherDashboardResponse> {
    const useDemo = this.config.enableDemoMode || !this.config.weatherAiApiKey;
    const source = useDemo ? "demo" : "weatherai";
    const raw = useDemo
      ? createDemoWeatherPayload(input)
      : await this.getClient().getWeather(input);
    const normalized = normalizeWeatherAiWeather(raw, {
      request: input,
      fetchedAt: this.now().toISOString(),
      source,
    });

    return {
      ...normalized.dashboard,
      risk: calculateRisk(normalized.riskInput),
    };
  }

  private getClient(): WeatherDataClient {
    if (this.client) {
      return this.client;
    }

    return new WeatherAiClient({
      apiKey: this.config.weatherAiApiKey ?? "",
      baseUrl: this.config.weatherAiBaseUrl,
    });
  }
}

export function createWeatherService(config: RuntimeConfig): WeatherService {
  return new WeatherService({ config });
}
