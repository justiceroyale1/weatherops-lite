import * as React from "react";

import { cn } from "@/lib/utils";

export function Alert({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
        className,
      )}
      role="alert"
      {...props}
    />
  );
}
