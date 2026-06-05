import { describe, expect, it } from "vitest";

import {
  calculateRisk,
  type NormalizedWeatherInput,
} from "./risk-engine";

describe("calculateRisk", () => {
  it("returns Low risk for normal field conditions", () => {
    const assessment = calculateRisk({
      temperatureC: 24,
      humidityPercent: 55,
      windSpeedKph: 8,
      precipitationProbability: 10,
      rainfallMm: 0,
      visibilityKm: 12,
      conditionText: "Clear",
      forecastDays: [
        {
          precipitationProbability: 10,
          rainfallMm: 0,
          maxTemperatureC: 26,
          minTemperatureC: 18,
          conditionText: "Clear",
        },
      ],
    });

    expect(assessment.score).toBe(0);
    expect(assessment.level).toBe("Low");
    expect(assessment.factors).toEqual([]);
    expect(assessment.recommendations).toHaveLength(1);
  });

  it("returns a moderate rain factor for elevated rain probability", () => {
    const assessment = calculateRisk({
      precipitationProbability: 55,
    });

    expect(assessment.score).toBe(15);
    expect(assessment.level).toBe("Low");
    expect(assessment.factors).toMatchObject([
      {
        id: "moderate-rain-probability",
        scoreImpact: 15,
      },
    ]);
  });

  it("returns Medium risk when moderate factors combine", () => {
    const assessment = calculateRisk({
      precipitationProbability: 55,
      windSpeedKph: 26,
    });

    expect(assessment.score).toBe(30);
    expect(assessment.level).toBe("Medium");
    expect(assessment.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it("returns a heavy rain factor when rain probability is high", () => {
    const assessment = calculateRisk({
      precipitationProbability: 75,
    });

    expect(assessment.score).toBe(25);
    expect(assessment.level).toBe("Medium");
    expect(assessment.factors).toContainEqual(
      expect.objectContaining({
        id: "heavy-rain-probability",
        severity: "Medium",
        observedValue: "75%",
      }),
    );
  });

  it("returns a high wind factor", () => {
    const assessment = calculateRisk({
      windSpeedKph: 42,
      windGustKph: 48,
    });

    expect(assessment.score).toBe(25);
    expect(assessment.factors).toContainEqual(
      expect.objectContaining({
        id: "high-wind",
        recommendation:
          "Avoid spraying and secure loose equipment before field crews start.",
      }),
    );
  });

  it("returns a high heat factor", () => {
    const assessment = calculateRisk({
      temperatureC: 39,
    });

    expect(assessment.score).toBe(25);
    expect(assessment.factors).toContainEqual(
      expect.objectContaining({
        id: "extreme-heat",
        metric: "temperatureC",
        observedValue: 39,
      }),
    );
  });

  it("returns a heat and humidity worker-safety factor", () => {
    const assessment = calculateRisk({
      temperatureC: 35,
      humidityPercent: 78,
    });

    expect(assessment.score).toBe(40);
    expect(assessment.level).toBe("Medium");
    expect(assessment.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "high-heat" }),
        expect.objectContaining({ id: "heat-humidity-stress" }),
      ]),
    );
    expect(assessment.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operationType: "worker-safety",
        }),
      ]),
    );
  });

  it("returns a storm factor from condition text", () => {
    const assessment = calculateRisk({
      conditionText: "Thunderstorm nearby",
    });

    expect(assessment.score).toBe(25);
    expect(assessment.factors).toContainEqual(
      expect.objectContaining({
        id: "storm-condition",
        observedValue: "Thunderstorm nearby",
      }),
    );
  });

  it("returns a low visibility factor", () => {
    const assessment = calculateRisk({
      visibilityKm: 4,
    });

    expect(assessment.score).toBe(15);
    expect(assessment.factors).toContainEqual(
      expect.objectContaining({
        id: "low-visibility",
        metric: "visibilityKm",
        observedValue: 4,
      }),
    );
  });

  it("returns a multi-day rainfall factor", () => {
    const assessment = calculateRisk({
      forecastDays: [
        { precipitationProbability: 65, rainfallMm: 5 },
        { precipitationProbability: 40, rainfallMm: 8 },
        { precipitationProbability: 70, rainfallMm: 12 },
      ],
    });

    expect(assessment.score).toBe(50);
    expect(assessment.level).toBe("High");
    expect(assessment.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "heavy-rain-probability" }),
        expect.objectContaining({ id: "multi-day-rainfall" }),
      ]),
    );
  });

  it("returns a dry spell irrigation factor", () => {
    const assessment = calculateRisk({
      forecastDays: [
        { precipitationProbability: 10, rainfallMm: 0 },
        { precipitationProbability: 15, rainfallMm: 0 },
        { precipitationProbability: 20, rainfallMm: 0 },
      ],
    });

    expect(assessment.score).toBe(10);
    expect(assessment.factors).toContainEqual(
      expect.objectContaining({
        id: "dry-spell",
        recommendation:
          "Review irrigation plans and inspect moisture-sensitive fields.",
      }),
    );
  });

  it("returns Critical for combined severe operating risks", () => {
    const assessment = calculateRisk({
      temperatureC: 39,
      humidityPercent: 80,
      windSpeedKph: 45,
      windGustKph: 60,
      precipitationProbability: 80,
      visibilityKm: 1,
      conditionText: "Severe thunderstorm",
      forecastDays: [
        { precipitationProbability: 80, rainfallMm: 15 },
        { precipitationProbability: 75, rainfallMm: 12 },
        { precipitationProbability: 70, rainfallMm: 10 },
      ],
    });

    expect(assessment.score).toBe(100);
    expect(assessment.level).toBe("Critical");
    expect(assessment.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it("clamps scores at 100", () => {
    const assessment = calculateRisk({
      temperatureC: 42,
      humidityPercent: 82,
      windSpeedKph: 55,
      windGustKph: 70,
      precipitationProbability: 90,
      visibilityKm: 0.5,
      conditionText: "Severe lightning storm",
      forecastDays: [
        {
          precipitationProbability: 90,
          rainfallMm: 25,
          maxTemperatureC: 43,
          minTemperatureC: 20,
        },
        { precipitationProbability: 90, rainfallMm: 22 },
        { precipitationProbability: 85, rainfallMm: 20 },
      ],
    });

    expect(assessment.score).toBe(100);
  });

  it("does not throw when optional fields are missing", () => {
    expect(() => calculateRisk({})).not.toThrow();

    const assessment = calculateRisk({});

    expect(assessment.score).toBe(0);
    expect(assessment.level).toBe("Low");
  });

  it("returns deterministic output for the same input", () => {
    const input: NormalizedWeatherInput = {
      temperatureC: 34,
      humidityPercent: 74,
      windSpeedKph: 26,
      precipitationProbability: 60,
      forecastDays: [
        {
          precipitationProbability: 62,
          rainfallMm: 9,
          maxTemperatureC: 36,
          minTemperatureC: 22,
          conditionText: "Rain",
        },
      ],
    };

    expect(calculateRisk(input)).toEqual(calculateRisk(input));
  });
});
