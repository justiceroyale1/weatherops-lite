import { getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";

import type { CreateLocationInput } from "../../schemas";
import type { LocationType } from "../../schemas";
import type { RiskLevel } from "../risk";
import type { LocationLastRiskUpdate, LocationProfile } from "./types";
import { defaultLocations } from "./default-locations";

export interface LocationRepository {
  create(input: CreateLocationInput): Promise<LocationProfile>;
  delete(id: string): Promise<void>;
  ensureDefaults(): Promise<void>;
  list(): Promise<LocationProfile[]>;
  updateLastRisk(id: string, update: LocationLastRiskUpdate): Promise<void>;
}

const collectionName = "locations";
const metadataCollectionName = "metadata";
const defaultsSeedDocumentId = "location-defaults";

export class FirestoreLocationRepository implements LocationRepository {
  private readonly db: Firestore;
  private readonly now: () => Date;

  constructor(options: { db?: Firestore; now?: () => Date } = {}) {
    this.db = options.db ?? getDefaultFirestore();
    this.now = options.now ?? (() => new Date());
  }

  async create(input: CreateLocationInput): Promise<LocationProfile> {
    const createdAt = Timestamp.fromDate(this.now());
    const doc = await this.db.collection(collectionName).add({
      ...input,
      createdAt,
      updatedAt: createdAt,
    });

    return {
      id: doc.id,
      ...input,
      createdAt: createdAt.toDate().toISOString(),
      updatedAt: createdAt.toDate().toISOString(),
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(collectionName).doc(id).delete();
  }

  async ensureDefaults(): Promise<void> {
    const seedRef = this.db
      .collection(metadataCollectionName)
      .doc(defaultsSeedDocumentId);
    const seedSnapshot = await seedRef.get();

    if (seedSnapshot.exists) {
      return;
    }

    const batch = this.db.batch();
    const now = Timestamp.fromDate(this.now());

    await Promise.all(
      defaultLocations.map(async (location) => {
        const ref = this.db.collection(collectionName).doc(location.id);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
          const { id: _id, ...data } = location;
          batch.set(ref, {
            ...data,
            createdAt: now,
            updatedAt: now,
          });
        }
      }),
    );

    batch.set(seedRef, {
      seededAt: now,
      defaults: defaultLocations.map((location) => location.id),
    });
    await batch.commit();
  }

  async list(): Promise<LocationProfile[]> {
    const snapshot = await this.db
      .collection(collectionName)
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map((doc) => toLocationProfile(doc.id, doc.data()));
  }

  async updateLastRisk(
    id: string,
    update: LocationLastRiskUpdate,
  ): Promise<void> {
    const checkedAt = Timestamp.fromDate(new Date(update.checkedAt));

    await this.db.collection(collectionName).doc(id).update({
      lastRiskScore: update.riskScore,
      lastRiskLevel: update.riskLevel,
      lastCheckedAt: checkedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

function getDefaultFirestore(): Firestore {
  if (getApps().length === 0) {
    initializeApp();
  }

  return getFirestore();
}

function toLocationProfile(id: string, data: DocumentData): LocationProfile {
  return {
    id,
    name: String(data.name ?? ""),
    type: toLocationType(data.type),
    lat: Number(data.lat),
    lon: Number(data.lon),
    ...(typeof data.notes === "string" ? { notes: data.notes } : {}),
    ...(typeof data.lastRiskScore === "number"
      ? { lastRiskScore: data.lastRiskScore }
      : {}),
    ...(isRiskLevel(data.lastRiskLevel)
      ? { lastRiskLevel: data.lastRiskLevel }
      : {}),
    ...(data.lastCheckedAt
      ? { lastCheckedAt: toIsoString(data.lastCheckedAt) }
      : {}),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function toLocationType(value: unknown): LocationType {
  return isLocationType(value) ? value : "farm";
}

function isLocationType(value: unknown): value is LocationType {
  return (
    value === "farm" ||
    value === "warehouse" ||
    value === "route" ||
    value === "event" ||
    value === "forestry"
  );
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return (
    value === "Low" ||
    value === "Medium" ||
    value === "High" ||
    value === "Critical"
  );
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
