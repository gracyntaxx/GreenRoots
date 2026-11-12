import { Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoBanner({ className }: { className?: string }) {
  return (
    <div
      role="region"
      aria-label="Sandbox and AI demo notice"
      className={cn(
        "relative z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-white/10 bg-moss-deep px-4 py-2 text-center text-[11px] font-medium text-white/90 sm:text-xs",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Leaf className="h-3.5 w-3.5 text-wheat" aria-hidden="true" />
        <strong className="font-bold text-white">DEMO MODE</strong>
      </span>
      <span className="hidden text-white/40 sm:inline">|</span>
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
        Gemini AI drafts require human review
      </span>
      <span className="hidden text-white/40 sm:inline">|</span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-[#6DB9E8]" aria-hidden="true" />
        PayPal Developer Sandbox · No real funds
      </span>
      <span className="rounded-full border border-wheat/50 bg-wheat/15 px-2 py-0.5 text-[10px] font-bold text-[#FDE68A]">
        Webhook verified
      </span>
    </div>
  );
}
