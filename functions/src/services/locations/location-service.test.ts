import { describe, expect, it } from "vitest";

import type { CreateLocationInput } from "../../schemas";
import { LocationService, type LocationRepository } from ".";
import type { LocationLastRiskUpdate, LocationProfile } from "./types";

describe("LocationService", () => {
  it("does not recreate deleted default locations after defaults are seeded", async () => {
    const repository = new InMemoryLocationRepository();
    const service = new LocationService({ repository });

    await service.listLocations();
    await service.deleteLocation("demo-nairobi-kenya");

    const locations = await service.listLocations();

    expect(locations.map((location) => location.id)).toEqual([
      "demo-abuja-nigeria",
    ]);
  });
});

class InMemoryLocationRepository implements LocationRepository {
  private locations: LocationProfile[] = [];
  private defaultsSeeded = false;

  async create(input: CreateLocationInput): Promise<LocationProfile> {
    const location = {
      id: "created-location",
      ...input,
      createdAt: "2026-06-05T09:00:00.000Z",
      updatedAt: "2026-06-05T09:00:00.000Z",
    };
    this.locations.push(location);
    return location;
  }

  async delete(id: string): Promise<void> {
    this.locations = this.locations.filter((location) => location.id !== id);
  }

  async ensureDefaults(): Promise<void> {
    if (this.defaultsSeeded) {
      return;
    }

    this.locations.push(
      {
        id: "demo-nairobi-kenya",
        name: "Nairobi, Kenya",
        type: "farm",
        lat: -1.286389,
        lon: 36.817223,
        createdAt: "2026-06-05T09:00:00.000Z",
        updatedAt: "2026-06-05T09:00:00.000Z",
      },
      {
        id: "demo-abuja-nigeria",
        name: "Abuja, Nigeria",
        type: "farm",
        lat: 9.076479,
        lon: 7.398574,
        createdAt: "2026-06-05T09:00:00.000Z",
        updatedAt: "2026-06-05T09:00:00.000Z",
      },
    );
    this.defaultsSeeded = true;
  }

  async list(): Promise<LocationProfile[]> {
    return this.locations;
  }

  async updateLastRisk(
    _id: string,
    _update: LocationLastRiskUpdate,
  ): Promise<void> {
    throw new Error("not used");
  }
}
