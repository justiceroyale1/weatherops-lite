import type { ApiUsageResponse } from "../../services/usage/types";

export interface UsageNormalizerOptions {
  fetchedAt: string;
}

export function normalizeWeatherAiUsage(
  raw: unknown,
  options: UsageNormalizerOptions,
): ApiUsageResponse {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? asRecord(root.usage) ?? root;
  const requests = asRecord(data.requests);
  const aiRequests = asRecord(data.aiRequests) ?? asRecord(data.ai);
  const period = asRecord(data.period);
  const plan = stringFrom(data.plan, data.planName, data.tier);
  const requestsUsed = numberFrom(
    data.requestsUsed,
    data.requestCount,
    requests?.used,
    requests?.current,
  );
  const requestsLimit = numberFrom(
    data.requestsLimit,
    data.requestLimit,
    requests?.limit,
    requests?.max,
  );
  const aiRequestsUsed = numberFrom(
    data.aiRequestsUsed,
    data.aiRequestCount,
    aiRequests?.used,
    aiRequests?.current,
  );
  const aiRequestsLimit = numberFrom(
    data.aiRequestsLimit,
    data.aiRequestLimit,
    aiRequests?.limit,
    aiRequests?.max,
  );
  const periodStart = stringFrom(data.periodStart, period?.start, data.startDate);
  const periodEnd = stringFrom(data.periodEnd, period?.end, data.endDate);

  return {
    ...(plan ? { plan } : {}),
    ...(requestsUsed !== undefined ? { requestsUsed } : {}),
    ...(requestsLimit !== undefined ? { requestsLimit } : {}),
    ...(aiRequestsUsed !== undefined ? { aiRequestsUsed } : {}),
    ...(aiRequestsLimit !== undefined ? { aiRequestsLimit } : {}),
    ...(periodStart ? { periodStart } : {}),
    ...(periodEnd ? { periodEnd } : {}),
    fetchedAt: options.fetchedAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function numberFrom(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function stringFrom(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return undefined;
}
