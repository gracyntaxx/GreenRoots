import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-semibold leading-none",
  {
    variants: {
      variant: {
        neutral: "border-line bg-oat text-muted",
        success: "border-growth/30 bg-sage text-[#1F5C35]",
        warning: "border-wheat/50 bg-wheat-soft text-[#8A5300]",
        error: "border-error/30 bg-[#FEE2E2] text-[#991B1B]",
        info: "border-navy/20 bg-[#E8EEF9] text-navy",
        escrow: "border-escrow/25 bg-[#E6F3FB] text-[#00598F]",
        ai: "border-wheat/50 bg-aitint text-[#8A5300]",
        outline: "border-line bg-transparent text-muted",
        forest: "border-forest/25 bg-sage text-forest",
        dark: "border-portal-line bg-portal-bg text-portal-muted",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
