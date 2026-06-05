import { getRuntimeConfig } from "../config";
import { applyCorsHeaders } from "../lib/cors";
import { AppError, toApiErrorResponse } from "../lib/errors";
import { weatherRequestSchema } from "../schemas";
import {
  createWeatherService,
  type WeatherService,
} from "../services/weather";

export interface WeatherHttpRequest {
  method?: string;
  headers?: {
    origin?: string;
  };
  body?: unknown;
}

export interface WeatherHttpResponse {
  setHeader(name: string, value: string): void;
  status(code: number): WeatherHttpResponse;
  json(body: unknown): void;
  send(body?: unknown): void;
}

export interface WeatherControllerOptions {
  service?: WeatherService;
}

export async function handleWeatherRequest(
  request: WeatherHttpRequest,
  response: WeatherHttpResponse,
  options: WeatherControllerOptions = {},
): Promise<void> {
  const config = getRuntimeConfig();
  applyCorsHeaders(request, response, config.allowedOrigins);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    if (request.method !== "POST") {
      throw new AppError("UNKNOWN_ERROR", 405, "Use POST for weather requests.");
    }

    const input = weatherRequestSchema.parse(parseBody(request.body));
    const service = options.service ?? createWeatherService(config);
    const result = await service.getDashboardWeather(input);

    response.status(200).json(result);
  } catch (error) {
    const apiError = toApiErrorResponse(error);
    response.status(apiError.status).json(apiError.body);
  }
}

function parseBody(body: unknown): unknown {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}
