import { describe, expect, it } from "vitest";

import { toApiErrorResponse } from "../errors";
import { WeatherAiClient } from "./weather-ai-client";

describe("WeatherAiClient", () => {
  it("builds the WeatherAI URL and sends ai=false when AI is disabled", async () => {
    let requestedUrl: URL | undefined;
    let authorizationHeader: string | null = null;
    const fetchImpl = async (input: URL | RequestInfo, init?: RequestInit) => {
      requestedUrl = input as URL;
      authorizationHeader = new Headers(init?.headers).get("Authorization");

      return jsonResponse({
        location: {},
        current: {},
      });
    };
    const client = new WeatherAiClient({
      apiKey: "test-secret",
      baseUrl: "https://example.test",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await client.getWeather({
      lat: 6.5244,
      lon: 3.3792,
      units: "metric",
      days: 7,
      includeAi: false,
    });

    expect(requestedUrl?.toString()).toBe(
      "https://example.test/v1/weather?lat=6.5244&lon=3.3792&units=metric&days=7&ai=false",
    );
    expect(authorizationHeader).toBe("Bearer test-secret");
  });

  it.each([
    [401, "UNAUTHORIZED", 401],
    [403, "FORBIDDEN", 403],
    [429, "RATE_LIMITED", 429],
    [503, "SERVICE_UNAVAILABLE", 503],
  ])("maps WeatherAI status %i to a safe app error", async (status, code, safeStatus) => {
    const client = new WeatherAiClient({
      apiKey: "test-secret",
      fetchImpl: (async () => jsonResponse({}, status)) as typeof fetch,
    });

    await expect(
      client.getWeather({
        lat: 0,
        lon: 0,
        units: "metric",
        days: 1,
        includeAi: true,
      }),
    ).rejects.toMatchObject({
      code,
      status: safeStatus,
    });
  });

  it("builds the WeatherAI usage URL with server-side authorization", async () => {
    let requestedUrl: URL | undefined;
    let authorizationHeader: string | null = null;
    const client = new WeatherAiClient({
      apiKey: "test-secret",
      baseUrl: "https://example.test",
      fetchImpl: (async (input: URL | RequestInfo, init?: RequestInit) => {
        requestedUrl = input as URL;
        authorizationHeader = new Headers(init?.headers).get("Authorization");

        return jsonResponse({
          plan: "Free",
        });
      }) as typeof fetch,
    });

    await client.getUsage();

    expect(requestedUrl?.toString()).toBe("https://example.test/v1/usage");
    expect(authorizationHeader).toBe("Bearer test-secret");
  });

  it("maps timeout failures to service unavailable", async () => {
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    const client = new WeatherAiClient({
      apiKey: "test-secret",
      fetchImpl: (async () => {
        throw abortError;
      }) as typeof fetch,
    });

    await expect(
      client.getWeather({
        lat: 0,
        lon: 0,
        units: "metric",
        days: 1,
        includeAi: true,
      }),
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      status: 504,
    });
  });

  it("maps malformed JSON responses to safe upstream errors", async () => {
    const client = new WeatherAiClient({
      apiKey: "test-secret",
      fetchImpl: (async () => jsonResponse("not an object")) as typeof fetch,
    });

    try {
      await client.getWeather({
        lat: 0,
        lon: 0,
        units: "metric",
        days: 1,
        includeAi: true,
      });
    } catch (error) {
      const response = toApiErrorResponse(error);

      expect(response.status).toBe(502);
      expect(response.body.code).toBe("UPSTREAM_ERROR");
      expect(JSON.stringify(response.body)).not.toContain("test-secret");
    }
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
