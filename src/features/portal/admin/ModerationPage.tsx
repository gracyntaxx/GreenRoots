import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Flag, Loader2, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { moderationService } from "@/services/moderationService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea, FieldError } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ModerationFlag } from "@/types";
import { timeAgo, cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Open: "bg-settle/15 text-[#92400E]",
  Dismissed: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Warned: "bg-[#FEF3C7] text-[#92400E]",
  Removed: "bg-error/10 text-error",
};

const decisions: { key: ModerationFlag["status"]; label: string; destructive?: boolean }[] = [
  { key: "Dismissed", label: "Dismiss" },
  { key: "Warned", label: "Warn" },
  { key: "Removed", label: "Remove", destructive: true },
];

export default function ModerationPage() {
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const flags = useQuery({ queryKey: ["flags"], queryFn: () => moderationService.list() });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ModerationFlag["status"] | "all">("Open");
  const [selected, setSelected] = useState<ModerationFlag | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ModerationFlag["status"] | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (flags.data ?? []).filter((f) => {
      if (status !== "all" && f.status !== status) return false;
      if (!term) return true;
      return [f.subject, f.evidence, f.kind, f.id].some((v) => v.toLowerCase().includes(term));
    });
  }, [flags.data, q, status]);

  const all = flags.data ?? [];

  const decide = async (decision: ModerationFlag["status"]) => {
    if (!selected) return;
    if (decision !== "Dismissed" && !reason.trim()) {
      setReasonError("A reason is required for this decision.");
      return;
    }
    setBusy(decision);
    try {
      await moderationService.decide(selected.id, decision, reason);
      pushToast({ title: `Flag ${decision.toLowerCase()}`, description: selected.subject, variant: decision === "Removed" ? "warning" : "success" });
      qc.invalidateQueries({ queryKey: ["flags"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      setSelected(null);
      setReason("");
      setReasonError(null);
    } catch (e) {
      pushToast({ title: "Could not save decision", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PortalPageHeader
        title="Moderation flags"
        description="Rule-based and AI-flagged activity. A flag is a prompt for a human decision, never an automatic punishment."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open" value={all.filter((f) => f.status === "Open").length} tone={all.some((f) => f.status === "Open") ? "warning" : "success"} icon={<ShieldAlert className="h-5 w-5 text-settle" />} />
        <StatCard label="AI flagged" value={all.filter((f) => f.source === "AI").length} sub="Needs human review" icon={<Sparkles className="h-5 w-5 text-ai" />} />
        <StatCard label="Rule flagged" value={all.filter((f) => f.source === "Rule").length} />
        <StatCard label="Resolved" value={all.filter((f) => f.status !== "Open").length} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject or evidence"
            className="min-h-10 rounded-portal pl-9 text-[13px]"
            aria-label="Search flags"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ModerationFlag["status"] | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] sm:w-44"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {["Open", "Dismissed", "Warned", "Removed"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {flags.isLoading && <Skeleton className="mt-3 h-64 w-full" />}

      {!flags.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<Flag className="h-7 w-7" />} title="No flags here" body="Nothing matches this filter." />
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {rows.map((f) => (
          <PortalCard key={f.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusTone[f.status])}>
                    {f.status}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      f.source === "AI" ? "bg-aitint text-[#4b3f97]" : "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted"
                    )}
                  >
                    {f.source === "AI" && <Sparkles className="h-2.5 w-2.5" />}
                    {f.source}
                  </span>
                  <span className="text-[10px] text-muted dark:text-portal-muted">{timeAgo(f.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-[14px] font-bold leading-snug">{f.kind}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted dark:text-portal-muted">{f.subject}</p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 rounded-lg bg-canvas p-2 text-[11px] leading-relaxed text-muted dark:bg-portal-bg dark:text-portal-muted">
              {f.evidence}
            </p>
            <Button variant="outline" size="portal" className="mt-3 w-full" onClick={() => setSelected(f)}>
              Review flag
            </Button>
          </PortalCard>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent variant="wide">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-settle" /> {selected.kind}
                </DialogTitle>
                <DialogDescription>
                  {selected.source === "AI" ? "AI-flagged" : "Rule-flagged"} · {timeAgo(selected.createdAt)} ·{" "}
                  {selected.subjectType}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-line p-3 dark:border-portal-line">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Subject</p>
                <p className="mt-0.5 text-[13px] font-semibold">{selected.subject}</p>
              </div>
              <div className="mt-2 rounded-lg bg-canvas p-3 dark:bg-portal-bg">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Evidence</p>
                <p className="mt-0.5 text-[13px] leading-relaxed">{selected.evidence}</p>
              </div>

              {selected.status === "Open" ? (
                <>
                  <Label htmlFor="mod-reason" className="mt-4">
                    Reason (required for warn or remove)
                  </Label>
                  <Textarea
                    id="mod-reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReasonError(null);
                    }}
                    placeholder="Record what you checked and why you are taking this decision."
                    className="min-h-20"
                  />
                  <FieldError>{reasonError}</FieldError>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {decisions.map((d) => (
                      <Button
                        key={d.key}
                        variant={d.destructive ? "danger" : d.key === "Warned" ? "secondary" : "outline"}
                        size="portal"
                        className="flex-1"
                        disabled={!!busy}
                        onClick={() => decide(d.key)}
                      >
                        {busy === d.key && <Loader2 className="h-4 w-4 animate-spin" />} {d.label}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-lg bg-canvas p-2.5 text-[12px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                  This flag was already decided: <strong>{selected.status}</strong>.
                </p>
              )}

              <p className="mt-3 text-[11px] text-muted dark:text-portal-muted">
                Acting as <strong className="text-ink dark:text-portal-ink">{profile.name}</strong>. The decision and
                reason are recorded in the audit log.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
