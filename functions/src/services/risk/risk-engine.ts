export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface NormalizedForecastDay {
  date?: string;
  precipitationProbability?: number;
  rainfallMm?: number;
  maxTemperatureC?: number;
  minTemperatureC?: number;
  conditionText?: string;
}

export interface NormalizedWeatherInput {
  temperatureC?: number;
  humidityPercent?: number;
  windSpeedKph?: number;
  windGustKph?: number;
  precipitationProbability?: number;
  rainfallMm?: number;
  visibilityKm?: number;
  conditionText?: string;
  forecastDays?: NormalizedForecastDay[];
}

export interface RiskFactor {
  id: string;
  label: string;
  severity: RiskLevel;
  scoreImpact: number;
  metric?: string;
  observedValue?: number | string;
  recommendation: string;
}

export interface OperationalRecommendation {
  id: string;
  title: string;
  description: string;
  operationType:
    | "spraying"
    | "irrigation"
    | "harvesting"
    | "delivery"
    | "inspection"
    | "worker-safety"
    | "general";
  priority: "low" | "medium" | "high";
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  headline: string;
  factors: RiskFactor[];
  recommendations: OperationalRecommendation[];
}

type RiskFactorInput = Omit<RiskFactor, "severity">;

const STORM_TERMS = ["storm", "thunder", "lightning", "severe"];

export function calculateRisk(input: NormalizedWeatherInput): RiskAssessment {
  const factors = collectRiskFactors(input).map((factor) => ({
    ...factor,
    severity: levelForScore(factor.scoreImpact),
  }));
  const score = clampScore(
    factors.reduce((total, factor) => total + factor.scoreImpact, 0),
  );
  const level = levelForScore(score);

  return {
    score,
    level,
    headline: headlineForLevel(level),
    factors,
    recommendations: buildRecommendations(level, factors),
  };
}

function collectRiskFactors(input: NormalizedWeatherInput): RiskFactorInput[] {
  const factors: RiskFactorInput[] = [];
  const forecastDays = input.forecastDays ?? [];
  const maxForecastRainProbability = maxDefined(
    forecastDays.map((day) => day.precipitationProbability),
  );
  const maxRainProbability = maxDefined([
    input.precipitationProbability,
    maxForecastRainProbability,
  ]);

  if (maxRainProbability !== undefined) {
    if (maxRainProbability >= 70) {
      factors.push({
        id: "heavy-rain-probability",
        label: "Heavy rain probability",
        scoreImpact: 25,
        metric: "precipitationProbability",
        observedValue: `${maxRainProbability}%`,
        recommendation:
          "Delay spraying and harvesting windows until rainfall risk drops.",
      });
    } else if (maxRainProbability >= 50) {
      factors.push({
        id: "moderate-rain-probability",
        label: "Rain probability",
        scoreImpact: 15,
        metric: "precipitationProbability",
        observedValue: `${maxRainProbability}%`,
        recommendation:
          "Monitor rainfall timing before committing crews to exposed field work.",
      });
    }
  }

  const rainyDays = forecastDays.filter(
    (day) =>
      (day.precipitationProbability ?? 0) >= 60 || (day.rainfallMm ?? 0) >= 8,
  ).length;

  if (rainyDays >= 3) {
    factors.push({
      id: "multi-day-rainfall",
      label: "Multi-day rainfall",
      scoreImpact: 25,
      metric: "forecastDays",
      observedValue: rainyDays,
      recommendation:
        "Plan drainage checks and avoid scheduling soil-sensitive operations across the wet period.",
    });
  } else if (rainyDays >= 2) {
    factors.push({
      id: "multi-day-rainfall-watch",
      label: "Multi-day rainfall watch",
      scoreImpact: 15,
      metric: "forecastDays",
      observedValue: rainyDays,
      recommendation:
        "Keep alternate work plans ready if repeated rainfall affects field access.",
    });
  }

  const windSpeed = input.windSpeedKph;
  const windGust = input.windGustKph;
  if ((windSpeed ?? 0) >= 40 || (windGust ?? 0) >= 55) {
    factors.push({
      id: "high-wind",
      label: "High wind",
      scoreImpact: 25,
      metric: "windKph",
      observedValue: observedWind(windSpeed, windGust),
      recommendation:
        "Avoid spraying and secure loose equipment before field crews start.",
    });
  } else if ((windSpeed ?? 0) >= 25 || (windGust ?? 0) >= 40) {
    factors.push({
      id: "elevated-wind",
      label: "Elevated wind",
      scoreImpact: 15,
      metric: "windKph",
      observedValue: observedWind(windSpeed, windGust),
      recommendation:
        "Check spray drift risk and keep delivery routes flexible.",
    });
  }

  const maxTemperature = maxDefined([
    input.temperatureC,
    ...forecastDays.map((day) => day.maxTemperatureC),
  ]);
  if (maxTemperature !== undefined) {
    if (maxTemperature >= 38) {
      factors.push({
        id: "extreme-heat",
        label: "Extreme heat",
        scoreImpact: 25,
        metric: "temperatureC",
        observedValue: maxTemperature,
        recommendation:
          "Move strenuous work to cooler hours and increase worker heat breaks.",
      });
    } else if (maxTemperature >= 32) {
      factors.push({
        id: "high-heat",
        label: "High heat",
        scoreImpact: 15,
        metric: "temperatureC",
        observedValue: maxTemperature,
        recommendation:
          "Schedule heat-sensitive tasks earlier and monitor worker comfort.",
      });
    }
  }

  if (input.temperatureC !== undefined && input.humidityPercent !== undefined) {
    if (input.temperatureC >= 34 && input.humidityPercent >= 75) {
      factors.push({
        id: "heat-humidity-stress",
        label: "Heat and humidity stress",
        scoreImpact: 25,
        metric: "temperatureC/humidityPercent",
        observedValue: `${input.temperatureC}C / ${input.humidityPercent}%`,
        recommendation:
          "Reduce heavy manual work and rotate crews through shaded rest periods.",
      });
    } else if (input.temperatureC >= 30 && input.humidityPercent >= 70) {
      factors.push({
        id: "heat-humidity-watch",
        label: "Heat and humidity watch",
        scoreImpact: 15,
        metric: "temperatureC/humidityPercent",
        observedValue: `${input.temperatureC}C / ${input.humidityPercent}%`,
        recommendation:
          "Build extra breaks into field schedules for warm and humid conditions.",
      });
    }
  }

  const dryDays = forecastDays.filter(
    (day) =>
      (day.precipitationProbability ?? 100) <= 20 && (day.rainfallMm ?? 1) === 0,
  ).length;

  if (dryDays >= 3) {
    factors.push({
      id: "dry-spell",
      label: "Dry spell",
      scoreImpact: 10,
      metric: "forecastDays",
      observedValue: dryDays,
      recommendation:
        "Review irrigation plans and inspect moisture-sensitive fields.",
    });
  }

  const conditionTexts = [
    input.conditionText,
    ...forecastDays.map((day) => day.conditionText),
  ];
  const stormText = conditionTexts.find((text) => hasStormTerm(text));
  if (stormText) {
    factors.push({
      id: "storm-condition",
      label: "Storm-like condition",
      scoreImpact: 25,
      metric: "conditionText",
      observedValue: stormText,
      recommendation:
        "Avoid exposed field operations while storm-like conditions are expected.",
    });
  }

  if (input.visibilityKm !== undefined) {
    if (input.visibilityKm <= 2) {
      factors.push({
        id: "very-low-visibility",
        label: "Very low visibility",
        scoreImpact: 25,
        metric: "visibilityKm",
        observedValue: input.visibilityKm,
        recommendation:
          "Delay inspections and deliveries that rely on clear visibility.",
      });
    } else if (input.visibilityKm <= 5) {
      factors.push({
        id: "low-visibility",
        label: "Low visibility",
        scoreImpact: 15,
        metric: "visibilityKm",
        observedValue: input.visibilityKm,
        recommendation:
          "Give drivers and inspection crews extra time for reduced visibility.",
      });
    }
  }

  const largestTemperatureSwing = maxDefined(
    forecastDays
      .filter(
        (day) =>
          day.maxTemperatureC !== undefined && day.minTemperatureC !== undefined,
      )
      .map((day) => day.maxTemperatureC! - day.minTemperatureC!),
  );

  if (largestTemperatureSwing !== undefined) {
    if (largestTemperatureSwing >= 18) {
      factors.push({
        id: "very-high-temperature-swing",
        label: "Very high temperature swing",
        scoreImpact: 15,
        metric: "temperatureSwingC",
        observedValue: largestTemperatureSwing,
        recommendation:
          "Protect sensitive materials and review timing for crop stress inspections.",
      });
    } else if (largestTemperatureSwing >= 12) {
      factors.push({
        id: "high-temperature-swing",
        label: "High temperature swing",
        scoreImpact: 10,
        metric: "temperatureSwingC",
        observedValue: largestTemperatureSwing,
        recommendation:
          "Monitor temperature-sensitive activities across morning and afternoon shifts.",
      });
    }
  }

  return factors;
}

function buildRecommendations(
  level: RiskLevel,
  factors: RiskFactor[],
): OperationalRecommendation[] {
  const recommendations = factors.map(recommendationForFactor);

  if (level === "Low") {
    return [
      {
        id: "normal-operations",
        title: "Proceed with normal field planning",
        description:
          "Current weather signals do not indicate elevated operational risk.",
        operationType: "general",
        priority: "low",
      },
    ];
  }

  const fallbackRecommendations: OperationalRecommendation[] = [
    {
      id: "review-field-schedule",
      title: "Review field schedule",
      description:
        "Move weather-sensitive work to the lowest-risk window available.",
      operationType: "general",
      priority: priorityForLevel(level),
    },
    {
      id: "brief-field-crews",
      title: "Brief field crews",
      description:
        "Share the main weather risks before crews begin outdoor work.",
      operationType: "worker-safety",
      priority: priorityForLevel(level),
    },
    {
      id: "prepare-alternate-work",
      title: "Prepare alternate work",
      description:
        "Keep indoor, maintenance, or inspection tasks ready if conditions worsen.",
      operationType: "general",
      priority: priorityForLevel(level),
    },
  ];

  for (const recommendation of fallbackRecommendations) {
    if (recommendations.length >= 3) {
      break;
    }

    if (!recommendations.some((item) => item.id === recommendation.id)) {
      recommendations.push(recommendation);
    }
  }

  return recommendations;
}

function recommendationForFactor(
  factor: RiskFactor,
): OperationalRecommendation {
  const priority = priorityForLevel(factor.severity);

  switch (factor.id) {
    case "heavy-rain-probability":
    case "moderate-rain-probability":
      return {
        id: "adjust-rain-sensitive-work",
        title: "Adjust rain-sensitive work",
        description: factor.recommendation,
        operationType: "harvesting",
        priority,
      };
    case "multi-day-rainfall":
    case "multi-day-rainfall-watch":
      return {
        id: "protect-field-access",
        title: "Protect field access",
        description: factor.recommendation,
        operationType: "inspection",
        priority,
      };
    case "high-wind":
    case "elevated-wind":
      return {
        id: "limit-wind-sensitive-work",
        title: "Limit wind-sensitive work",
        description: factor.recommendation,
        operationType: "spraying",
        priority,
      };
    case "extreme-heat":
    case "high-heat":
    case "heat-humidity-stress":
    case "heat-humidity-watch":
      return {
        id: "manage-heat-exposure",
        title: "Manage heat exposure",
        description: factor.recommendation,
        operationType: "worker-safety",
        priority,
      };
    case "dry-spell":
      return {
        id: "review-irrigation-plan",
        title: "Review irrigation plan",
        description: factor.recommendation,
        operationType: "irrigation",
        priority,
      };
    case "storm-condition":
      return {
        id: "avoid-exposed-work",
        title: "Avoid exposed work",
        description: factor.recommendation,
        operationType: "worker-safety",
        priority,
      };
    case "very-low-visibility":
    case "low-visibility":
      return {
        id: "slow-delivery-and-inspection",
        title: "Slow delivery and inspection work",
        description: factor.recommendation,
        operationType: "delivery",
        priority,
      };
    default:
      return {
        id: `respond-to-${factor.id}`,
        title: factor.label,
        description: factor.recommendation,
        operationType: "general",
        priority,
      };
  }
}

function levelForScore(score: number): RiskLevel {
  if (score >= 75) {
    return "Critical";
  }

  if (score >= 50) {
    return "High";
  }

  if (score >= 25) {
    return "Medium";
  }

  return "Low";
}

function headlineForLevel(level: RiskLevel): string {
  switch (level) {
    case "Critical":
      return "Avoid or delay risky field operations.";
    case "High":
      return "Adjust schedules and prepare mitigation.";
    case "Medium":
      return "Monitor conditions before committing field crews.";
    case "Low":
      return "Normal operations are likely workable.";
  }
}

function priorityForLevel(level: RiskLevel): "low" | "medium" | "high" {
  if (level === "Critical" || level === "High") {
    return "high";
  }

  if (level === "Medium") {
    return "medium";
  }

  return "low";
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function maxDefined(values: Array<number | undefined>): number | undefined {
  const numbers = values.filter((value): value is number => value !== undefined);
  return numbers.length > 0 ? Math.max(...numbers) : undefined;
}

function observedWind(
  windSpeedKph: number | undefined,
  windGustKph: number | undefined,
): string {
  const parts = [];

  if (windSpeedKph !== undefined) {
    parts.push(`${windSpeedKph} kph sustained`);
  }

  if (windGustKph !== undefined) {
    parts.push(`${windGustKph} kph gust`);
  }

  return parts.join(", ");
}

function hasStormTerm(text: string | undefined): text is string {
  if (!text) {
    return false;
  }

  const normalized = text.toLowerCase();
  return STORM_TERMS.some((term) => normalized.includes(term));
}
