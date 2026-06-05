import type { CreateLocationInput } from "../../schemas";
import { FirestoreLocationRepository, type LocationRepository } from "./location-repository";
import type { LocationLastRiskUpdate, LocationProfile } from "./types";

export interface LocationServiceOptions {
  repository?: LocationRepository;
}

export class LocationService {
  private readonly repository: LocationRepository;

  constructor(options: LocationServiceOptions = {}) {
    this.repository = options.repository ?? new FirestoreLocationRepository();
  }

  async createLocation(input: CreateLocationInput): Promise<LocationProfile> {
    return this.repository.create(input);
  }

  async deleteLocation(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async listLocations(): Promise<LocationProfile[]> {
    await this.repository.ensureDefaults();
    return this.repository.list();
  }

  async updateLastRisk(
    id: string,
    update: LocationLastRiskUpdate,
  ): Promise<void> {
    await this.repository.updateLastRisk(id, update);
  }
}

export function createLocationService(): LocationService {
  return new LocationService();
}
