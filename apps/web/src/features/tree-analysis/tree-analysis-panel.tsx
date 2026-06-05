import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Loader2, Trees } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTreeAnalysisHistoryQuery,
  useTreeAnalysisMutation,
} from "./api";
import {
  treeAnalysisMetadataSchema,
  type TreeAnalysisMetadataInput,
  type TreeAnalysisMetadataValues,
  validateTreeImageFile,
} from "@/lib/validations/tree-analysis";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils/formatters";
import type { TreeAnalysisResponse } from "@/types/tree-analysis";

const defaultValues: TreeAnalysisMetadataInput = {
  locationName: "",
  landAcres: "",
  notes: "",
};

export function TreeAnalysisPanel() {
  const history = useTreeAnalysisHistoryQuery();
  const mutation = useTreeAnalysisMutation();
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TreeAnalysisMetadataInput, undefined, TreeAnalysisMetadataValues>({
    defaultValues,
    resolver: zodResolver(treeAnalysisMetadataSchema),
  });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onSubmit(values: TreeAnalysisMetadataValues) {
    const error = validateTreeImageFile(file);
    setFileError(error);

    if (error || !file) {
      return;
    }

    await mutation.mutateAsync({
      image: file,
      ...values,
      locationName: values.locationName || undefined,
      notes: values.notes || undefined,
    });
    setFile(undefined);
    reset(defaultValues);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trees aria-hidden="true" className="h-4 w-4" />
          Tree Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mutation.error instanceof Error ? <Alert>{mutation.error.message}</Alert> : null}
        <form className="grid gap-3" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Field error={fileError} id="tree-image" label="Farm image">
            <Input
              accept="image/jpeg,image/png,image/webp"
              disabled={mutation.isPending}
              id="tree-image"
              onChange={(event) => {
                const nextFile = event.target.files?.[0];
                setFile(nextFile);
                setFileError(validateTreeImageFile(nextFile));
              }}
              type="file"
            />
          </Field>
          {previewUrl ? (
            <img
              alt="Selected farm preview"
              className="max-h-56 w-full rounded-md border object-cover"
              src={previewUrl}
            />
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              <ImageUp aria-hidden="true" className="mr-2 h-4 w-4" />
              Upload a JPEG, PNG, or WebP image
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field error={errors.locationName?.message} id="tree-location" label="Location name">
              <Input disabled={mutation.isPending} id="tree-location" {...register("locationName")} />
            </Field>
            <Field error={errors.landAcres?.message} id="tree-acres" label="Land acres">
              <Input disabled={mutation.isPending} id="tree-acres" min="0" step="any" type="number" {...register("landAcres")} />
            </Field>
          </div>
          <Field error={errors.notes?.message} id="tree-notes" label="Notes">
            <Input disabled={mutation.isPending} id="tree-notes" {...register("notes")} />
          </Field>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            Analyze image
          </Button>
        </form>

        {mutation.data ? <TreeAnalysisResult result={mutation.data} /> : null}
        <TreeAnalysisHistory
          analyses={history.data?.analyses ?? []}
          isLoading={history.isLoading}
        />
      </CardContent>
    </Card>
  );
}

function TreeAnalysisResult({ result }: { result: TreeAnalysisResponse }) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Latest analysis</p>
        <Badge>{formatDateTime(result.createdAt)}</Badge>
      </div>
      <AnalysisMetrics result={result} />
      {result.overlayImageUrl ? (
        <img
          alt="Tree analysis overlay"
          className="max-h-56 w-full rounded-md border object-cover"
          src={result.overlayImageUrl}
        />
      ) : null}
      <TextList items={result.observations} title="Observations" />
      <TextList items={result.recommendations} title="Recommendations" />
    </div>
  );
}

function TreeAnalysisHistory({
  analyses,
  isLoading,
}: {
  analyses: TreeAnalysisResponse[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return <p className="text-sm text-muted-foreground">No analysis history yet.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Recent analyses</p>
      <ul className="space-y-2">
        {analyses.slice(0, 3).map((analysis) => (
          <li className="rounded-md border p-3 text-sm" key={analysis.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <span>{formatDateTime(analysis.createdAt)}</span>
              <span>{formatNumber(analysis.totalTreeCount)} trees</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisMetrics({ result }: { result: TreeAnalysisResponse }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
      <Metric label="Trees" value={formatNumber(result.totalTreeCount)} />
      <Metric label="Density" value={formatNumber(result.treeDensityPerAcre, " / acre")} />
      <Metric label="Canopy" value={formatPercent(result.canopyCoveragePct)} />
      <Metric label="Confidence" value={formatPercent(toPercent(result.confidenceScore))} />
      {result.speciesGuess ? <Metric label="Species" value={result.speciesGuess} /> : null}
    </dl>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function TextList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not available</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
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

function toPercent(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value <= 1 ? value * 100 : value;
}
