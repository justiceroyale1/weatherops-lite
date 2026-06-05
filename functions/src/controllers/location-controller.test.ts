import { describe, expect, it } from "vitest";

import {
  handleLocationRequest,
  type LocationHttpResponse,
} from "./location-controller";
import { LocationService } from "../services/locations";
import type {
  LocationLastRiskUpdate,
  LocationProfile,
  LocationRepository,
} from "../services/locations";
import type { CreateLocationInput } from "../schemas";

describe("handleLocationRequest", () => {
  it("lists default locations through the service", async () => {
    const response = createResponse();
    const repository = new InMemoryLocationRepository();
    const service = new LocationService({ repository });

    await handleLocationRequest(
      {
        method: "GET",
        headers: {
          origin: "http://localhost:5173",
        },
      },
      response,
      { service },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      locations: [
        { id: "demo-nairobi-kenya", name: "Nairobi, Kenya" },
        { id: "demo-abuja-nigeria", name: "Abuja, Nigeria" },
      ],
    });
    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("creates a valid location", async () => {
    const response = createResponse();
    const service = new LocationService({
      repository: new InMemoryLocationRepository(),
    });

    await handleLocationRequest(
      {
        method: "POST",
        body: {
          name: "North Farm",
          type: "farm",
          lat: 9.1,
          lon: 7.4,
        },
      },
      response,
      { service },
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      name: "North Farm",
      type: "farm",
      lat: 9.1,
      lon: 7.4,
    });
  });

  it("returns safe validation errors for invalid creates", async () => {
    const response = createResponse();

    await handleLocationRequest(
      {
        method: "POST",
        body: {
          name: "N",
          type: "farm",
          lat: 100,
          lon: 0,
        },
      },
      response,
      {
        service: new LocationService({
          repository: new InMemoryLocationRepository(),
        }),
      },
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Check the submitted data and try again.",
    });
    expect(JSON.stringify(response.body)).not.toContain("stack");
  });

  it("deletes locations safely", async () => {
    const response = createResponse();
    const repository = new InMemoryLocationRepository();
    const service = new LocationService({ repository });

    await handleLocationRequest(
      {
        method: "DELETE",
        body: {
          id: "demo-nairobi-kenya",
        },
      },
      response,
      { service },
    );

    expect(response.statusCode).toBe(204);
    expect(response.sentBody).toBe("");
  });

  it("handles CORS preflight", async () => {
    const response = createResponse();

    await handleLocationRequest(
      {
        method: "OPTIONS",
      },
      response,
    );

    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Methods"]).toBe(
      "GET, POST, DELETE, OPTIONS",
    );
  });
});

interface TestResponse extends LocationHttpResponse {
  body?: unknown;
  headers: Record<string, string>;
  sentBody?: unknown;
  statusCode?: number;
}

function createResponse(): TestResponse {
  return {
    headers: {},
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
    send(body?: unknown) {
      this.sentBody = body;
    },
  };
}

class InMemoryLocationRepository implements LocationRepository {
  private locations: LocationProfile[] = [];
  private defaultsSeeded = false;

  async create(input: CreateLocationInput): Promise<LocationProfile> {
    const location = {
      id: `location-${this.locations.length + 1}`,
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

    const defaults: LocationProfile[] = [
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
    ];

    for (const location of defaults) {
      if (!this.locations.some((item) => item.id === location.id)) {
        this.locations.push(location);
      }
    }

    this.defaultsSeeded = true;
  }

  async list(): Promise<LocationProfile[]> {
    return this.locations;
  }

  async updateLastRisk(
    id: string,
    update: LocationLastRiskUpdate,
  ): Promise<void> {
    this.locations = this.locations.map((location) =>
      location.id === id
        ? {
            ...location,
            lastRiskScore: update.riskScore,
            lastRiskLevel: update.riskLevel,
            lastCheckedAt: update.checkedAt,
          }
        : location,
    );
  }
}
