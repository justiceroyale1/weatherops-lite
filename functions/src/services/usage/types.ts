export interface ApiUsageResponse {
  plan?: string;
  requestsUsed?: number;
  requestsLimit?: number;
  aiRequestsUsed?: number;
  aiRequestsLimit?: number;
  periodStart?: string;
  periodEnd?: string;
  fetchedAt: string;
}
