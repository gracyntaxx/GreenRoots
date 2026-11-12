import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#1B3B2B" />
      <path d="M20 34C20 24 20 18 20 12" stroke="#FBF9F5" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 22C13 22 8.5 17.5 8.5 11.5C14.5 11.5 20 15.5 20 22Z" fill="#7FB069" stroke="#FBF9F5" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 17C27 17 31.5 12.5 31.5 6.5C25.5 6.5 20 10.5 20 17Z" fill="#EAB308" stroke="#FBF9F5" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M11 34C15 32.5 25 32.5 29 34" stroke="#D96B27" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={compact ? "h-8 w-8" : undefined} />
      <div className="leading-none">
        <span
          className={cn(
            "font-heading font-bold tracking-[-0.03em] text-moss dark:text-portal-ink",
            compact ? "text-lg" : "text-xl"
          )}
        >
          Green<span className="text-terracotta">Roots</span>
        </span>
        {!compact && (
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted dark:text-portal-muted">
            Agri-Waste Circular Exchange
          </span>
        )}
      </div>
    </div>
  );
}

const cropPaths: Record<string, string> = {
  paddy_straw: "M12 28V12M12 18c4 0 7-3 7-7-4 0-7 3-7 7Zm0 6c-4 0-7-3-7-7 4 0 7 3 7 7Zm8-1c3 0 5-2 5-5-3 0-5 2-5 5Z",
  wheat_straw: "M12 28V11m0 5c3 0 5-2 5-5-3 0-5 2-5 5Zm0 4c-3 0-5-2-5-5 3 0 5 2 5 5Zm0 4c3 0 5-2 5-5-3 0-5 2-5 5Z",
  rice_husk: "M6 22c2-7 5-10 12-10s10 3 12 10c-4 3-8 4-12 4s-8-1-12-4Z",
  mustard_stubble: "M12 28V14m0 2c-4 0-6-2-6-6 4 0 6 2 6 6Zm0 5c4 0 6-2 6-6-4 0-6 2-6 6Z",
  sugarcane_trash: "M9 28 13 10m5 18L15 10m5 18L17 10m5 18L19 10",
  cashew_shell: "M8 20c0-6 4-10 9-10s8 4 8 9-4 9-9 9-8-2-8-8Zm5-1h8",
  cotton_stalk: "M12 28V14m-4 6c0-4 2-7 5-7s5 3 5 7-2 6-5 6-5-2-5-6Zm9-4c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5Z",
  groundnut_shell: "M9 16c0-4 3-7 7-7 5 0 7 4 7 8s-3 8-7 8c-4 0-7-4-7-9Zm5 2h1m2 3h1m-4-7h1",
  bagasse: "M7 24c4-8 10-12 18-12M7 28c4-8 10-12 18-12M10 28c3-6 8-9 14-9",
};

export function CropIcon({
  wasteType,
  className,
  size = "md",
}: {
  wasteType: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-forest/15 bg-meadow text-forest",
        dims,
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-2/3 w-2/3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={cropPaths[wasteType] ?? cropPaths.paddy_straw} />
      </svg>
    </span>
  );
}
