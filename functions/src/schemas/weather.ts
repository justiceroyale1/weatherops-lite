import { z } from "zod";

export const weatherRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  units: z.enum(["metric", "imperial"]),
  days: z.number().int().min(1).max(7),
  includeAi: z.boolean(),
});

export type WeatherRequest = z.infer<typeof weatherRequestSchema>;
