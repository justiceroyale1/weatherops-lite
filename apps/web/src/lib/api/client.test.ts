import { describe, expect, it } from "vitest";

import { ApiClient, ApiClientError } from "./client";

describe("ApiClient", () => {
  it("posts JSON to the backend function", async () => {
    let requestUrl = "";
    let requestBody = "";
    const client = new ApiClient({
      baseUrl: "https://functions.test",
      fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
        requestUrl = String(input);
        requestBody = String(init?.body);

        return jsonResponse({ ok: true });
      }) as typeof fetch,
    });

    const response = await client.post<{ ok: boolean }>("/weather", {
      lat: 6,
    });

    expect(requestUrl).toBe("https://functions.test/weather");
    expect(requestBody).toBe(JSON.stringify({ lat: 6 }));
    expect(response.ok).toBe(true);
  });

  it("maps safe backend errors", async () => {
    const client = new ApiClient({
      baseUrl: "https://functions.test",
      fetchImpl: (async () =>
        jsonResponse(
          {
            code: "RATE_LIMITED",
            message: "API quota or rate limit reached.",
          },
          429,
        )) as typeof fetch,
    });

    await expect(client.post("/weather", {})).rejects.toBeInstanceOf(
      ApiClientError,
    );
    await expect(client.post("/weather", {})).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
      message: "API quota or rate limit reached.",
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
