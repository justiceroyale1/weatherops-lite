import { describe, expect, it } from "vitest";

import {
  handleTreeAnalysisRequest,
  type TreeAnalysisHttpResponse,
} from "./tree-analysis-controller";
import {
  TreeAnalysisService,
  type TreeAnalysisRepository,
} from "../services/tree-analysis";
import type { TreeAnalysisMetadata } from "../schemas";
import type { TreeAnalysisResponse } from "../services/tree-analysis";

describe("handleTreeAnalysisRequest", () => {
  it("rejects unsupported methods", async () => {
    const response = createResponse();

    await handleTreeAnalysisRequest({ method: "DELETE" }, response, {
      service: createService(),
    });

    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({
      code: "UNKNOWN_ERROR",
      message: "Use GET or POST for tree analysis requests.",
    });
  });

  it("handles CORS preflight", async () => {
    const response = createResponse();

    await handleTreeAnalysisRequest({ method: "OPTIONS" }, response);

    expect(response.statusCode).toBe(204);
    expect(response.sentBody).toBe("");
  });

  it("returns history", async () => {
    const response = createResponse();
    const service = createService();

    await service.analyze({
      file: {
        buffer: Buffer.alloc(128),
        contentType: "image/png",
        filename: "field.png",
        size: 128,
      },
    });
    await handleTreeAnalysisRequest({ method: "GET" }, response, { service });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      analyses: [expect.objectContaining({ id: "analysis-1" })],
    });
  });

  it("validates multipart upload and returns analysis", async () => {
    const response = createResponse();

    await handleTreeAnalysisRequest(
      {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=test-boundary",
        },
        rawBody: createMultipartBody(),
      },
      response,
      { service: createService() },
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: "analysis-1",
      observations: expect.arrayContaining([expect.stringContaining("Demo fallback")]),
    });
  });
});

function createService() {
  return new TreeAnalysisService({
    config: {
      allowedOrigins: ["http://localhost:5173"],
      enableDemoMode: true,
      weatherAiBaseUrl: "https://api.weather-ai.co",
    },
    now: () => new Date("2026-06-05T09:00:00.000Z"),
    repository: new InMemoryTreeAnalysisRepository(),
    uuid: () => "analysis-1",
  });
}

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

interface TestResponse extends TreeAnalysisHttpResponse {
  body?: unknown;
  headers: Record<string, string>;
  sentBody?: unknown;
  statusCode?: number;
}

function createResponse(): TestResponse {
  return {
    headers: {},
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
    send(body?: unknown) {
      this.sentBody = body;
    },
  };
}

function createMultipartBody(): Buffer {
  return Buffer.from(
    [
      "--test-boundary",
      'Content-Disposition: form-data; name="locationName"',
      "",
      "North Farm",
      "--test-boundary",
      'Content-Disposition: form-data; name="image"; filename="field.png"',
      "Content-Type: image/png",
      "",
      "fake image data",
      "--test-boundary--",
      "",
    ].join("\r\n"),
    "binary",
  );
}
