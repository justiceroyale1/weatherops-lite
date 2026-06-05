export interface RuntimeConfig {
  allowedOrigins: string[];
  enableDemoMode: boolean;
  weatherAiApiKey?: string;
  weatherAiBaseUrl: string;
}

export function getRuntimeConfig(env = process.env): RuntimeConfig {
  return {
    allowedOrigins: parseAllowedOrigins(env.ALLOWED_ORIGINS),
    enableDemoMode:
      env.VITE_ENABLE_DEMO_MODE === "true" || env.ENABLE_DEMO_MODE === "true",
    weatherAiApiKey: env.WEATHERAI_API_KEY,
    weatherAiBaseUrl: env.WEATHERAI_BASE_URL ?? "https://api.weather-ai.co",
  };
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const defaults = ["http://localhost:5173"];

  if (!value) {
    return defaults;
  }

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : defaults;
}
