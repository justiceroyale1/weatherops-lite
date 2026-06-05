import { describe, expect, it } from "vitest";

import {
  handleUsageRequest,
  type UsageHttpResponse,
} from "./usage-controller";
import { UsageService } from "../services/usage";
import type { UsageDataClient } from "../services/usage";

describe("handleUsageRequest", () => {
  it("rejects non-GET methods with a safe response", async () => {
    const response = createResponse();

    await handleUsageRequest(
      {
        method: "POST",
        headers: {
          origin: "http://localhost:5173",
        },
      },
      response,
    );

    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({
      code: "UNKNOWN_ERROR",
      message: "Use GET for usage requests.",
    });
    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("handles CORS preflight", async () => {
    const response = createResponse();

    await handleUsageRequest(
      {
        method: "OPTIONS",
      },
      response,
    );

    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Methods"]).toBe(
      "GET, POST, DELETE, OPTIONS",
    );
  });

  it("returns usage data for GET requests", async () => {
    const response = createResponse();
    const client: UsageDataClient = {
      async getUsage() {
        return {
          plan: "Free",
          requestsUsed: 12,
        };
      },
    };

    await handleUsageRequest(
      {
        method: "GET",
      },
      response,
      {
        service: new UsageService({
          client,
          config: {
            allowedOrigins: ["http://localhost:5173"],
            enableDemoMode: false,
            weatherAiApiKey: "test-secret",
            weatherAiBaseUrl: "https://api.weather-ai.co",
          },
          now: () => new Date("2026-06-05T09:00:00.000Z"),
        }),
      },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      plan: "Free",
      requestsUsed: 12,
      fetchedAt: "2026-06-05T09:00:00.000Z",
    });
  });
});

interface TestResponse extends UsageHttpResponse {
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
