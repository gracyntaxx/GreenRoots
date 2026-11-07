import * as React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/types";

export interface ConfirmFact {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}

export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  facts,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading,
  destructive,
  actor,
  variant = "sheet",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  facts?: ConfirmFact[];
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  destructive?: boolean;
  actor?: { name: string; role: Role };
  variant?: "sheet" | "center";
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent variant={variant} className={variant === "center" ? "max-w-lg" : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive ? (
              <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-forest" aria-hidden="true" />
            )}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {facts && facts.length > 0 && (
          <dl className="space-y-2 rounded-xl border border-line bg-canvas p-3 dark:border-portal-line dark:bg-portal-bg">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start justify-between gap-4">
                <dt className="text-[13px] text-muted dark:text-portal-muted">{f.label}</dt>
                <dd className={f.emphasis ? "num text-base font-bold text-ink dark:text-portal-ink" : "text-sm font-semibold text-ink dark:text-portal-ink"}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {children}
        {actor && (
          <p className="mt-3 text-[12px] text-muted dark:text-portal-muted">
            Acting as <strong className="text-ink dark:text-portal-ink">{actor.name}</strong> ({ROLE_LABELS[actor.role]}).
            This action is recorded in the audit log.
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            size={variant === "sheet" ? "field" : "portal"}
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            size={variant === "sheet" ? "field" : "portal"}
            onClick={onConfirm}
            disabled={loading}
            className="min-w-32"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
