import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, RefreshCw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateLocationMutation,
  useDeleteLocationMutation,
  useLocationsQuery,
} from "./api";
import {
  locationFormSchema,
  type LocationFormInput,
  type LocationFormValues,
} from "@/lib/validations/location";
import { formatDateTime } from "@/lib/utils/formatters";
import type { LocationProfile } from "@/types/location";

export interface SavedLocationsPanelProps {
  isRefreshing: boolean;
  onUseLocation(location: LocationProfile): void;
}

const defaultValues: LocationFormInput = {
  name: "",
  type: "farm",
  lat: -1.286389,
  lon: 36.817223,
  notes: "",
};

export function SavedLocationsPanel({
  isRefreshing,
  onUseLocation,
}: SavedLocationsPanelProps) {
  const locations = useLocationsQuery();
  const createMutation = useCreateLocationMutation();
  const deleteMutation = useDeleteLocationMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<LocationFormInput, undefined, LocationFormValues>({
    defaultValues,
    resolver: zodResolver(locationFormSchema),
  });

  async function handleCreate(values: LocationFormValues) {
    await createMutation.mutateAsync({
      ...values,
      notes: values.notes || undefined,
    });
    reset(defaultValues);
  }

  const errorMessage =
    locations.error instanceof Error
      ? locations.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          Saved Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? <Alert>{errorMessage}</Alert> : null}

        <form className="grid gap-3" noValidate onSubmit={handleSubmit(handleCreate)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field error={errors.name?.message} id="location-name" label="Name">
              <Input
                aria-invalid={Boolean(errors.name)}
                disabled={createMutation.isPending}
                id="location-name"
                {...register("name")}
              />
            </Field>
            <Field error={errors.type?.message} id="location-type" label="Type">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={createMutation.isPending}
                id="location-type"
                {...register("type")}
              >
                <option value="farm">Farm</option>
                <option value="warehouse">Warehouse</option>
                <option value="route">Route</option>
                <option value="event">Event</option>
                <option value="forestry">Forestry</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field error={errors.lat?.message} id="location-lat" label="Latitude">
              <Input
                aria-invalid={Boolean(errors.lat)}
                disabled={createMutation.isPending}
                id="location-lat"
                step="any"
                type="number"
                {...register("lat")}
              />
            </Field>
            <Field error={errors.lon?.message} id="location-lon" label="Longitude">
              <Input
                aria-invalid={Boolean(errors.lon)}
                disabled={createMutation.isPending}
                id="location-lon"
                step="any"
                type="number"
                {...register("lon")}
              />
            </Field>
          </div>
          <Field error={errors.notes?.message} id="location-notes" label="Notes">
            <Input
              aria-invalid={Boolean(errors.notes)}
              disabled={createMutation.isPending}
              id="location-notes"
              {...register("notes")}
            />
          </Field>
          <Button disabled={createMutation.isPending} type="submit">
            {createMutation.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            Save location
          </Button>
        </form>

        {locations.isLoading ? <SavedLocationsLoading /> : null}

        {!locations.isLoading && locations.data?.locations.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No saved locations yet.
          </p>
        ) : null}

        {!locations.isLoading && locations.data?.locations.length ? (
          <ul className="space-y-3">
            {locations.data.locations.map((location) => (
              <SavedLocationRow
                deletePending={deleteMutation.isPending}
                isRefreshing={isRefreshing}
                key={location.id}
                location={location}
                onDelete={(id) => deleteMutation.mutate(id)}
                onUse={onUseLocation}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SavedLocationsLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div className="rounded-md border p-3" key={index}>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-3 h-3 w-56" />
        </div>
      ))}
    </div>
  );
}

function SavedLocationRow({
  deletePending,
  isRefreshing,
  location,
  onDelete,
  onUse,
}: {
  deletePending: boolean;
  isRefreshing: boolean;
  location: LocationProfile;
  onDelete(id: string): void;
  onUse(location: LocationProfile): void;
}) {
  return (
    <li className="rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{location.name}</p>
            <Badge>{location.type}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          </p>
          {location.lastRiskLevel ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last risk: {location.lastRiskLevel} ({location.lastRiskScore ?? 0}
              /100)
              {location.lastCheckedAt
                ? ` · ${formatDateTime(location.lastCheckedAt)}`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            disabled={isRefreshing}
            onClick={() => onUse(location)}
            size="sm"
            type="button"
          >
            {isRefreshing ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            aria-label={`Delete ${location.name}`}
            disabled={deletePending}
            onClick={() => onDelete(location.id)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
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
