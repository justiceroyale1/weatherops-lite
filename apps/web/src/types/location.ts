import type { RiskLevel } from "./weather";

export type LocationType = "farm" | "warehouse" | "route" | "event" | "forestry";

export interface LocationProfile {
  id: string;
  name: string;
  type: LocationType;
  lat: number;
  lon: number;
  notes?: string;
  lastRiskScore?: number;
  lastRiskLevel?: RiskLevel;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  type: LocationType;
  lat: number;
  lon: number;
  notes?: string;
}
