import { z } from "zod";

export const locationTypeSchema = z.enum([
  "farm",
  "warehouse",
  "route",
  "event",
  "forestry",
]);

export const createLocationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: locationTypeSchema,
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  notes: z.string().trim().max(300).optional(),
});

export const deleteLocationSchema = z.object({
  id: z.string().min(1).max(120),
});

export type LocationType = z.infer<typeof locationTypeSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type DeleteLocationInput = z.infer<typeof deleteLocationSchema>;
