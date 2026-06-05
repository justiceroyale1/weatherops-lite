import { getRuntimeConfig } from "../config";
import { applyCorsHeaders } from "../lib/cors";
import { AppError, toApiErrorResponse } from "../lib/errors";
import { createUsageService, type UsageService } from "../services/usage";

export interface UsageHttpRequest {
  method?: string;
  headers?: {
    origin?: string;
  };
}

export interface UsageHttpResponse {
  setHeader(name: string, value: string): void;
  status(code: number): UsageHttpResponse;
  json(body: unknown): void;
  send(body?: unknown): void;
}

export interface UsageControllerOptions {
  service?: UsageService;
}

export async function handleUsageRequest(
  request: UsageHttpRequest,
  response: UsageHttpResponse,
  options: UsageControllerOptions = {},
): Promise<void> {
  const config = getRuntimeConfig();
  applyCorsHeaders(request, response, config.allowedOrigins);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    if (request.method !== "GET") {
      throw new AppError("UNKNOWN_ERROR", 405, "Use GET for usage requests.");
    }

    const service = options.service ?? createUsageService(config);
    response.status(200).json(await service.getUsage());
  } catch (error) {
    const apiError = toApiErrorResponse(error);
    response.status(apiError.status).json(apiError.body);
  }
}
