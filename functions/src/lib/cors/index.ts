export interface HeaderRequest {
  headers?: {
    origin?: string;
  };
}

export interface HeaderResponse {
  setHeader(name: string, value: string): void;
}

export function applyCorsHeaders(
  request: HeaderRequest,
  response: HeaderResponse,
  allowedOrigins: string[],
): void {
  const origin = request.headers?.origin;
  const allowOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  if (allowOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowOrigin);
  }

  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "3600");
}
