import type { RuntimeConfig } from "../../config";
import { WeatherAiClient } from "../../lib/weather-ai";
import { normalizeWeatherAiWeather } from "../../lib/weather-ai/weather-normalizer";
import type { WeatherRequest } from "../../schemas";
import {
  FirestoreLocationRepository,
  type LocationRepository,
} from "../locations";
import { calculateRisk } from "../risk";
import { createDemoWeatherPayload } from "./demo-weather";
import type { WeatherDashboardResponse } from "./types";

export interface WeatherServiceOptions {
  config: RuntimeConfig;
  client?: WeatherDataClient;
  locationRepository?: LocationRepository;
  now?: () => Date;
}

export interface WeatherDataClient {
  getWeather(input: WeatherRequest): Promise<unknown>;
}

export class WeatherService {
  private readonly config: RuntimeConfig;
  private readonly client?: WeatherDataClient;
  private readonly locationRepository?: LocationRepository;
  private readonly now: () => Date;

  constructor(options: WeatherServiceOptions) {
    this.config = options.config;
    this.client = options.client;
    this.locationRepository = options.locationRepository;
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

    const risk = calculateRisk(normalized.riskInput);
    const dashboard = {
      ...normalized.dashboard,
      risk,
    };

    if (input.locationId) {
      await this.getLocationRepository().updateLastRisk(input.locationId, {
        riskScore: risk.score,
        riskLevel: risk.level,
        checkedAt: dashboard.fetchedAt,
      });
    }

    return dashboard;
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

  private getLocationRepository(): LocationRepository {
    return this.locationRepository ?? new FirestoreLocationRepository();
  }
}

export function createWeatherService(config: RuntimeConfig): WeatherService {
  return new WeatherService({ config });
}
