export function createDemoUsagePayload() {
  return {
    plan: "Demo",
    requests: {
      used: 124,
      limit: 500,
    },
    aiRequests: {
      used: 37,
      limit: 100,
    },
    period: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-06-30T23:59:59.000Z",
    },
  };
}
