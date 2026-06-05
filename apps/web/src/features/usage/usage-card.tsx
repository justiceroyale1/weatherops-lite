import { Activity, AlertTriangle } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsageQuery } from "./api";
import {
  formatDateTime,
  formatQuotaValue,
  getProgressPercent,
} from "@/lib/utils/formatters";
import type { ApiUsageResponse } from "@/types/usage";

export function UsageCard() {
  const usage = useUsageQuery();

  if (usage.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (usage.isError || !usage.data) {
    const message =
      usage.error instanceof Error ? usage.error.message : "Usage unavailable";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity aria-hidden="true" className="h-4 w-4" />
            API Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="flex items-start gap-2">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
            <span>{message || "Usage unavailable"}</span>
          </Alert>
          <p className="text-sm text-muted-foreground">Usage unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return <UsageCardContent usage={usage.data} />;
}

function UsageCardContent({ usage }: { usage: ApiUsageResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Activity aria-hidden="true" className="h-4 w-4" />
            API Usage
          </span>
          {usage.plan ? <Badge>{usage.plan}</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageProgress
          label="Weather requests"
          limit={usage.requestsLimit}
          used={usage.requestsUsed}
        />
        <UsageProgress
          label="AI requests"
          limit={usage.aiRequestsLimit}
          used={usage.aiRequestsUsed}
        />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Fetched {formatDateTime(usage.fetchedAt)}</p>
          {usage.periodStart || usage.periodEnd ? (
            <p>
              Period {usage.periodStart ? formatDateTime(usage.periodStart) : "Not available"} -{" "}
              {usage.periodEnd ? formatDateTime(usage.periodEnd) : "Not available"}
            </p>
          ) : null}
          <p>Disable AI summaries in the report form to preserve AI quota.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageProgress({
  label,
  limit,
  used,
}: {
  label: string;
  limit?: number;
  used?: number;
}) {
  const progress = getProgressPercent(used, limit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatQuotaValue(used, limit)}
        </span>
      </div>
      <div
        aria-label={`${label} ${formatQuotaValue(used, limit)}`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
