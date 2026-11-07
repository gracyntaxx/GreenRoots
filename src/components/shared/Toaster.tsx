import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useUi, type ToastVariant } from "@/store/ui";
import { cn } from "@/lib/utils";

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const tones: Record<ToastVariant, string> = {
  success: "border-growth/40 bg-[#F0FDF4] text-[#116b33]",
  error: "border-error/40 bg-[#FEF2F2] text-[#991B1B]",
  warning: "border-settle/50 bg-[#FFFBEB] text-[#92400E]",
  info: "border-navy/25 bg-[#EFF6FF] text-navy",
};

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-2 z-[100] flex flex-col items-center gap-2 px-3"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];
        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-[400px] items-start gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 shadow-lg animate-fade-in",
              tones[toast.variant]
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-[13px] leading-snug opacity-90">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
