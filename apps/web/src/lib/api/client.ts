export interface ApiErrorResponse {
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "RATE_LIMITED"
    | "UPSTREAM_ERROR"
    | "SERVICE_UNAVAILABLE"
    | "UNKNOWN_ERROR";
  message: string;
  details?: Record<string, unknown>;
}

export class ApiClientError extends Error {
  readonly code?: ApiErrorResponse["code"];
  readonly status: number;

  constructor(message: string, status: number, code?: ApiErrorResponse["code"]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const localFunctionsProjectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "weatherops-lite";
const localFunctionsEmulatorOrigin =
  import.meta.env.VITE_FUNCTIONS_EMULATOR_ORIGIN ?? "http://127.0.0.1:5001";
const localFunctionsBaseUrl =
  `${localFunctionsEmulatorOrigin}/${localFunctionsProjectId}/us-central1`;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl?: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl =
      options.baseUrl ??
      import.meta.env.VITE_FUNCTIONS_BASE_URL ??
      localFunctionsBaseUrl;
    this.fetchImpl = options.fetchImpl;
  }

  async get<TResponse>(path: string): Promise<TResponse> {
    const response = await this.getFetch()(`${this.baseUrl}${path}`, {
      method: "GET",
    });
    const payload = (await response.json().catch(() => undefined)) as unknown;

    if (!response.ok) {
      throw toClientError(payload, response.status);
    }

    return payload as TResponse;
  }

  async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
    const response = await this.getFetch()(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => undefined) as unknown;

    if (!response.ok) {
      throw toClientError(payload, response.status);
    }

    return payload as TResponse;
  }

  async delete(path: string, body: unknown): Promise<void> {
    const response = await this.getFetch()(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => undefined)) as unknown;

    if (!response.ok) {
      throw toClientError(payload, response.status);
    }
  }

  private getFetch(): typeof fetch {
    return this.fetchImpl ?? fetch;
  }
}

export const apiClient = new ApiClient();

function toClientError(payload: unknown, status: number): ApiClientError {
  if (isApiError(payload)) {
    return new ApiClientError(payload.message, status, payload.code);
  }

  return new ApiClientError("The weather report could not be loaded.", status);
}

function isApiError(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}
