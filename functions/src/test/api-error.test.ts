import { describe, expect, it } from "vitest";

import { AppError, toApiErrorResponse } from "../lib/errors";
import { weatherRequestSchema } from "../schemas";

describe("toApiErrorResponse", () => {
  it("maps Zod errors to safe validation responses", () => {
    const result = weatherRequestSchema.safeParse({
      lat: 120,
      lon: 0,
      units: "metric",
      days: 7,
      includeAi: true,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const response = toApiErrorResponse(result.error);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.message).toBe(
        "Check the submitted data and try again.",
      );
      expect(JSON.stringify(response.body)).not.toContain("stack");
    }
  });

  it("maps AppError instances to their safe response", () => {
    const response = toApiErrorResponse(
      new AppError("RATE_LIMITED", 429),
    );

    expect(response.status).toBe(429);
    expect(response.body.code).toBe("RATE_LIMITED");
    expect(response.body.message).toContain("quota");
  });

  it("maps unknown errors without exposing internals", () => {
    const response = toApiErrorResponse(new Error("database password leaked"));

    expect(response.status).toBe(500);
    expect(response.body.code).toBe("UNKNOWN_ERROR");
    expect(response.body.message).toBe("Something went wrong.");
    expect(JSON.stringify(response.body)).not.toContain("database password");
  });
});
