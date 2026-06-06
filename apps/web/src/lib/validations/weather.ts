import { z } from "zod";

export const weatherFormSchema = z.object({
  lat: z.coerce
    .number({ message: "Latitude is required." })
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90."),
  lon: z.coerce
    .number({ message: "Longitude is required." })
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180."),
  units: z.enum(["metric", "imperial"]),
  days: z.coerce
    .number({ message: "Forecast days are required." })
    .int("Forecast days must be a whole number.")
    .min(1, "Forecast days must be at least 1.")
    .max(7, "Forecast days cannot be more than 7."),
});

export type WeatherFormInput = z.input<typeof weatherFormSchema>;
export type WeatherFormValues = z.infer<typeof weatherFormSchema>;
