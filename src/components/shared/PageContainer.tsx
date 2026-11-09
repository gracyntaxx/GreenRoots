import * as React from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

