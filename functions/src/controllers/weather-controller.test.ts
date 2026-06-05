import { describe, expect, it } from "vitest";

import { handleWeatherRequest, type WeatherHttpResponse } from "./weather-controller";

describe("handleWeatherRequest", () => {
  it("rejects non-POST methods with a safe response", async () => {
    const response = createResponse();

    await handleWeatherRequest(
      {
        method: "GET",
        headers: {
          origin: "http://localhost:5173",
        },
      },
      response,
    );

    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({
      code: "UNKNOWN_ERROR",
      message: "Use POST for weather requests.",
    });
    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("handles CORS preflight", async () => {
    const response = createResponse();

    await handleWeatherRequest(
      {
        method: "OPTIONS",
      },
      response,
    );

    expect(response.statusCode).toBe(204);
    expect(response.sentBody).toBe("");
    expect(response.headers["Access-Control-Allow-Methods"]).toBe(
      "GET, POST, DELETE, OPTIONS",
    );
  });

  it("returns validation errors for invalid request bodies", async () => {
    const response = createResponse();

    await handleWeatherRequest(
      {
        method: "POST",
        body: {
          lat: 120,
          lon: 0,
          units: "metric",
          days: 1,
          includeAi: true,
        },
      },
      response,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Check the submitted data and try again.",
    });
    expect(JSON.stringify(response.body)).not.toContain("stack");
  });

  it("returns weather dashboard data for valid requests", async () => {
    const response = createResponse();

    await handleWeatherRequest(
      {
        method: "POST",
        body: {
          lat: 6.5244,
          lon: 3.3792,
          units: "metric",
          days: 2,
          includeAi: false,
        },
      },
      response,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      location: {
        lat: 6.5244,
        lon: 3.3792,
      },
      source: "demo",
    });
    expect(response.body).toHaveProperty("risk");
  });
});

interface TestResponse extends WeatherHttpResponse {
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
