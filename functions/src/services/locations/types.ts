import type { RiskLevel } from "../risk";
import type { LocationType } from "../../schemas";

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

export interface LocationLastRiskUpdate {
  riskScore: number;
  riskLevel: RiskLevel;
  checkedAt: string;
}
