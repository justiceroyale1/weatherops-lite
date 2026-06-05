import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  weatherFormSchema,
  type WeatherFormInput,
  type WeatherFormValues,
} from "@/lib/validations/weather";

export interface WeatherFormProps {
  isSubmitting: boolean;
  onSubmit(values: WeatherFormValues): void;
}

const defaultValues: WeatherFormInput = {
  lat: 6.5244,
  lon: 3.3792,
  units: "metric",
  days: 3,
  includeAi: true,
};

export function WeatherForm({ isSubmitting, onSubmit }: WeatherFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<WeatherFormInput, undefined, WeatherFormValues>({
    defaultValues,
    resolver: zodResolver(weatherFormSchema),
  });

  return (
    <form
      className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-2 2xl:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto] 2xl:items-end"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <Field error={errors.lat?.message} id="weather-lat" label="Latitude">
        <Input
          aria-invalid={Boolean(errors.lat)}
          disabled={isSubmitting}
          id="weather-lat"
          step="any"
          type="number"
          {...register("lat")}
        />
      </Field>
      <Field error={errors.lon?.message} id="weather-lon" label="Longitude">
        <Input
          aria-invalid={Boolean(errors.lon)}
          disabled={isSubmitting}
          id="weather-lon"
          step="any"
          type="number"
          {...register("lon")}
        />
      </Field>
      <Field error={errors.units?.message} id="weather-units" label="Units">
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          disabled={isSubmitting}
          id="weather-units"
          {...register("units")}
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </Field>
      <Field
        error={errors.days?.message}
        id="weather-days"
        label="Forecast days"
      >
        <Input
          aria-invalid={Boolean(errors.days)}
          disabled={isSubmitting}
          id="weather-days"
          max={7}
          min={1}
          type="number"
          {...register("days")}
        />
      </Field>
      <div className="flex flex-col gap-3">
        <label className="flex min-h-9 items-center gap-2 text-sm">
          <input
            className="h-4 w-4 rounded border-input accent-primary"
            disabled={isSubmitting}
            type="checkbox"
            {...register("includeAi")}
          />
          AI summary
        </label>
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : null}
          Generate report
        </Button>
      </div>
    </form>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
