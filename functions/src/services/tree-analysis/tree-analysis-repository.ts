import { getApps, initializeApp } from "firebase-admin/app";
import {
  Timestamp,
  getFirestore,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";

import type { TreeAnalysisMetadata } from "../../schemas";
import type { TreeAnalysisResponse } from "./types";

export interface TreeAnalysisRepository {
  create(
    analysis: TreeAnalysisResponse,
    metadata: TreeAnalysisMetadata,
  ): Promise<TreeAnalysisResponse>;
  list(): Promise<TreeAnalysisResponse[]>;
}

const collectionName = "treeAnalyses";

export class FirestoreTreeAnalysisRepository implements TreeAnalysisRepository {
  private readonly db: Firestore;

  constructor(db?: Firestore) {
    this.db = db ?? getDefaultFirestore();
  }

  async create(
    analysis: TreeAnalysisResponse,
    metadata: TreeAnalysisMetadata,
  ): Promise<TreeAnalysisResponse> {
    const createdAt = Timestamp.fromDate(new Date(analysis.createdAt));
    const docRef = this.db.collection(collectionName).doc(analysis.id);

    await docRef.set({
      ...metadata,
      ...analysis,
      createdAt,
    });

    return analysis;
  }

  async list(): Promise<TreeAnalysisResponse[]> {
    const snapshot = await this.db
      .collection(collectionName)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    return snapshot.docs.map((doc) => toTreeAnalysisResponse(doc.id, doc.data()));
  }
}

function getDefaultFirestore(): Firestore {
  if (getApps().length === 0) {
    initializeApp();
  }

  return getFirestore();
}

function toTreeAnalysisResponse(
  id: string,
  data: DocumentData,
): TreeAnalysisResponse {
  const health = asRecord(data.healthBreakdown);

  return {
    id,
    ...(numberFrom(data.totalTreeCount) !== undefined ? { totalTreeCount: numberFrom(data.totalTreeCount) } : {}),
    ...(numberFrom(data.treeDensityPerAcre) !== undefined ? { treeDensityPerAcre: numberFrom(data.treeDensityPerAcre) } : {}),
    ...(numberFrom(data.canopyCoveragePct) !== undefined ? { canopyCoveragePct: numberFrom(data.canopyCoveragePct) } : {}),
    ...(numberFrom(data.confidenceScore) !== undefined ? { confidenceScore: numberFrom(data.confidenceScore) } : {}),
    ...(typeof data.speciesGuess === "string" ? { speciesGuess: data.speciesGuess } : {}),
    ...(health ? {
      healthBreakdown: {
        ...(numberFrom(health.healthy) !== undefined ? { healthy: numberFrom(health.healthy) } : {}),
        ...(numberFrom(health.moderate) !== undefined ? { moderate: numberFrom(health.moderate) } : {}),
        ...(numberFrom(health.poor) !== undefined ? { poor: numberFrom(health.poor) } : {}),
        ...(numberFrom(health.unknown) !== undefined ? { unknown: numberFrom(health.unknown) } : {}),
      },
    } : {}),
    ...(typeof data.originalImageUrl === "string" ? { originalImageUrl: data.originalImageUrl } : {}),
    ...(typeof data.overlayImageUrl === "string" ? { overlayImageUrl: data.overlayImageUrl } : {}),
    observations: Array.isArray(data.observations)
      ? data.observations.filter((item): item is string => typeof item === "string")
      : [],
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations.filter((item): item is string => typeof item === "string")
      : [],
    createdAt: toIsoString(data.createdAt),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function numberFrom(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(0).toISOString();
}
