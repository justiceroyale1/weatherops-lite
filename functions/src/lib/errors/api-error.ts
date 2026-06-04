import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

const defaultMessages: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: "Check the submitted data and try again.",
  UNAUTHORIZED: "WeatherAI API key is invalid or missing.",
  FORBIDDEN: "This feature may not be available on the current plan.",
  RATE_LIMITED:
    "API quota or rate limit reached. Try again later or disable AI summaries.",
  UPSTREAM_ERROR: "WeatherAI returned an unexpected error.",
  SERVICE_UNAVAILABLE: "WeatherAI is temporarily unavailable.",
  UNKNOWN_ERROR: "Something went wrong.",
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    status: number,
    message = defaultMessages[code],
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toApiErrorResponse(error: unknown): {
  status: number;
  body: ApiErrorResponse;
} {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        message: defaultMessages.VALIDATION_ERROR,
        details: {
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
    };
  }

  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "UNKNOWN_ERROR",
      message: defaultMessages.UNKNOWN_ERROR,
    },
  };
}
