import { AppError } from "../errors";
import type { TreeAnalysisMetadata, WeatherRequest } from "../../schemas";
import type { TreeAnalysisFile } from "../../services/tree-analysis/types";

export interface WeatherAiClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class WeatherAiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: WeatherAiClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.weather-ai.co";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async getWeather(input: WeatherRequest): Promise<unknown> {
    const url = new URL("/v1/weather", this.baseUrl);
    url.searchParams.set("lat", String(input.lat));
    url.searchParams.set("lon", String(input.lon));
    url.searchParams.set("units", input.units);
    url.searchParams.set("days", String(input.days));

    if (!input.includeAi) {
      url.searchParams.set("ai", "false");
    }

    return this.getJson(url);
  }

  async getUsage(): Promise<unknown> {
    return this.getJson(new URL("/v1/usage", this.baseUrl));
  }

  async analyzeTrees(
    file: TreeAnalysisFile,
    metadata: TreeAnalysisMetadata,
  ): Promise<unknown> {
    const formData = new FormData();
    formData.set(
      "image",
      new Blob([file.buffer], { type: file.contentType }),
      file.filename,
    );

    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        formData.set(key, String(value));
      }
    }

    return this.postForm(new URL("/v1/trees/analyze", this.baseUrl), formData);
  }

  private async getJson(url: URL): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw mapWeatherAiStatus(response.status);
      }

      const body = await response.json();

      if (!isRecord(body)) {
        throw new AppError(
          "UPSTREAM_ERROR",
          502,
          "WeatherAI returned an unexpected response.",
        );
      }

      return body;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (isAbortError(error)) {
        throw new AppError(
          "SERVICE_UNAVAILABLE",
          504,
          "WeatherAI request timed out.",
        );
      }

      throw new AppError(
        "UPSTREAM_ERROR",
        502,
        "WeatherAI returned an unexpected error.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async postForm(url: URL, body: FormData): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw mapWeatherAiStatus(response.status);
      }

      const responseBody = await response.json();

      if (!isRecord(responseBody)) {
        throw new AppError(
          "UPSTREAM_ERROR",
          502,
          "WeatherAI returned an unexpected response.",
        );
      }

      return responseBody;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (isAbortError(error)) {
        throw new AppError(
          "SERVICE_UNAVAILABLE",
          504,
          "WeatherAI request timed out.",
        );
      }

      throw new AppError(
        "UPSTREAM_ERROR",
        502,
        "WeatherAI returned an unexpected error.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

function mapWeatherAiStatus(status: number): AppError {
  if (status === 401) {
    return new AppError("UNAUTHORIZED", 401);
  }

  if (status === 403) {
    return new AppError("FORBIDDEN", 403);
  }

  if (status === 429) {
    return new AppError("RATE_LIMITED", 429);
  }

  if (status >= 500) {
    return new AppError("SERVICE_UNAVAILABLE", 503);
  }

  return new AppError("UPSTREAM_ERROR", 502);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("abort"))
  );
}
