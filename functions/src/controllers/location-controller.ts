import { applyCorsHeaders } from "../lib/cors";
import { AppError, toApiErrorResponse } from "../lib/errors";
import { createLocationSchema, deleteLocationSchema } from "../schemas";
import {
  createLocationService,
  type LocationService,
} from "../services/locations";
import { getRuntimeConfig } from "../config";

export interface LocationHttpRequest {
  method?: string;
  headers?: {
    origin?: string;
  };
  body?: unknown;
  query?: Record<string, unknown>;
}

export interface LocationHttpResponse {
  setHeader(name: string, value: string): void;
  status(code: number): LocationHttpResponse;
  json(body: unknown): void;
  send(body?: unknown): void;
}

export interface LocationControllerOptions {
  service?: LocationService;
}

export async function handleLocationRequest(
  request: LocationHttpRequest,
  response: LocationHttpResponse,
  options: LocationControllerOptions = {},
): Promise<void> {
  const config = getRuntimeConfig();
  applyCorsHeaders(request, response, config.allowedOrigins);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const service = options.service ?? createLocationService();

  try {
    if (request.method === "GET") {
      response.status(200).json({
        locations: await service.listLocations(),
      });
      return;
    }

    if (request.method === "POST") {
      const input = createLocationSchema.parse(parseBody(request.body));
      response.status(201).json(await service.createLocation(input));
      return;
    }

    if (request.method === "DELETE") {
      const input = deleteLocationSchema.parse({
        id: readDeleteId(request),
      });
      await service.deleteLocation(input.id);
      response.status(204).send("");
      return;
    }

    throw new AppError(
      "UNKNOWN_ERROR",
      405,
      "Use GET, POST, or DELETE for location requests.",
    );
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

function readDeleteId(request: LocationHttpRequest): unknown {
  const body = parseBody(request.body);

  if (typeof body === "object" && body !== null && "id" in body) {
    return (body as { id: unknown }).id;
  }

  return request.query?.id;
}
