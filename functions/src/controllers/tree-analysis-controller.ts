import { getRuntimeConfig } from "../config";
import { applyCorsHeaders } from "../lib/cors";
import { AppError, toApiErrorResponse } from "../lib/errors";
import {
  createTreeAnalysisService,
  type TreeAnalysisService,
} from "../services/tree-analysis";
import { parseTreeAnalysisMultipart } from "./multipart";

export interface TreeAnalysisHttpRequest {
  method?: string;
  headers?: {
    origin?: string;
    "content-type"?: string;
  };
  rawBody?: Buffer;
}

export interface TreeAnalysisHttpResponse {
  setHeader(name: string, value: string): void;
  status(code: number): TreeAnalysisHttpResponse;
  json(body: unknown): void;
  send(body?: unknown): void;
}

export interface TreeAnalysisControllerOptions {
  service?: TreeAnalysisService;
}

export async function handleTreeAnalysisRequest(
  request: TreeAnalysisHttpRequest,
  response: TreeAnalysisHttpResponse,
  options: TreeAnalysisControllerOptions = {},
): Promise<void> {
  const config = getRuntimeConfig();
  applyCorsHeaders(request, response, config.allowedOrigins);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const service = options.service ?? createTreeAnalysisService(config);

  try {
    if (request.method === "GET") {
      response.status(200).json({
        analyses: await service.listHistory(),
      });
      return;
    }

    if (request.method === "POST") {
      const input = parseTreeAnalysisMultipart(
        request.headers?.["content-type"],
        request.rawBody,
      );
      response.status(201).json(await service.analyze(input));
      return;
    }

    throw new AppError(
      "UNKNOWN_ERROR",
      405,
      "Use GET or POST for tree analysis requests.",
    );
  } catch (error) {
    const apiError = toApiErrorResponse(error);
    response.status(apiError.status).json(apiError.body);
  }
}
