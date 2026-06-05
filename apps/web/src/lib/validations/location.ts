import { z } from "zod";

export const locationFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name cannot be more than 80 characters."),
  type: z.enum(["farm", "warehouse", "route", "event", "forestry"]),
  lat: z.coerce
    .number({ message: "Latitude is required." })
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90."),
  lon: z.coerce
    .number({ message: "Longitude is required." })
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180."),
  notes: z.string().trim().max(300, "Notes cannot be more than 300 characters.").optional(),
});

export type LocationFormInput = z.input<typeof locationFormSchema>;
export type LocationFormValues = z.infer<typeof locationFormSchema>;
