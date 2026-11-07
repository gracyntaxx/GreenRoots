import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, Search, Trash2 } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { adminService } from "@/services/adminService";
import { poolService } from "@/services/poolService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea, FieldError } from "@/components/ui/form";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WASTE_LABELS, type Requirement, type WasteType } from "@/types";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { formatDate, cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Open: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  Fulfilled: "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]",
  Expired: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Closed: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Draft: "bg-settle/15 text-[#92400E]",
};

export default function AdminRequirementsPage() {
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const requirements = useQuery({ queryKey: ["admin-requirements"], queryFn: () => adminService.requirements() });
  const pools = useQuery({ queryKey: ["pools", profile.id], queryFn: () => poolService.list(profile) });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Requirement["status"] | "all">("all");
  const [waste, setWaste] = useState<WasteType | "all">("all");
  const [target, setTarget] = useState<Requirement | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const poolMap = useMemo(() => new Map((pools.data ?? []).map((p) => [p.id, p])), [pools.data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (requirements.data ?? []).filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (waste !== "all" && r.wasteType !== waste) return false;
      if (!term) return true;
      return [r.id, r.industryName, r.village, WASTE_LABELS[r.wasteType]].some((v) => v.toLowerCase().includes(term));
    });
  }, [requirements.data, q, status, waste]);

  const all = requirements.data ?? [];

  const remove = async () => {
    if (!target) return;
    if (!reason.trim()) {
      setReasonError("A reason is required.");
      return;
    }
    setBusy(true);
    try {
      await adminService.removeRequirement(target.id, reason);
      pushToast({ title: "Requirement removed", description: `${WASTE_LABELS[target.wasteType]} · ${target.industryName}`, variant: "success" });
      qc.invalidateQueries({ queryKey: ["admin-requirements"] });
      qc.invalidateQueries({ queryKey: ["requirements"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      setTarget(null);
      setReason("");
      setReasonError(null);
    } catch (e) {
      pushToast({ title: "Could not remove requirement", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PortalPageHeader
        title="Requirements"
        description="Industry requirements across the platform. Removing a requirement is audited; an open pool may still need separate handling."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total requirements" value={all.length} icon={<ClipboardList className="h-5 w-5 text-forest" />} />
        <StatCard label="Open" value={all.filter((r) => r.status === "Open").length} tone="success" />
        <StatCard label="Fulfilled" value={all.filter((r) => r.status === "Fulfilled").length} />
        <StatCard label="Unverified industries" value={all.filter((r) => !r.industryVerified).length} tone={all.some((r) => !r.industryVerified) ? "warning" : "default"} />
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search industry, village, waste or ID"
            className="min-h-10 rounded-portal pl-9 text-[13px]"
            aria-label="Search requirements"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as Requirement["status"] | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] lg:w-40"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {["Open", "Fulfilled", "Expired", "Closed", "Draft"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={waste}
          onChange={(e) => setWaste(e.target.value as WasteType | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] lg:w-48"
          aria-label="Filter by waste type"
        >
          <option value="all">All waste types</option>
          {(Object.keys(WASTE_LABELS) as WasteType[]).map((w) => (
            <option key={w} value={w}>
              {WASTE_LABELS[w]}
            </option>
          ))}
        </Select>
      </div>

      {requirements.isLoading && <Skeleton className="mt-3 h-64 w-full" />}

      {!requirements.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="No requirements found" body="Try a different filter." />
        </div>
      )}

      {rows.length > 0 && (
        <PortalCard className="mt-3 overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Requirement</TH>
                <TH>Industry</TH>
                <TH>Target</TH>
                <TH>Committed</TH>
                <TH>Rate</TH>
                <TH>Deadline</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => {
                const pool = poolMap.get(r.poolId);
                const percent = pool && pool.targetKg > 0 ? Math.min(100, Math.round((pool.committedKg / pool.targetKg) * 100)) : 0;
                return (
                  <TR key={r.id}>
                    <TD>
                      <p className="font-semibold">{WASTE_LABELS[r.wasteType]}</p>
                      <p className="num text-[10px] text-muted dark:text-portal-muted">{r.id}</p>
                    </TD>
                    <TD>
                      <p className="text-[12px] font-medium">{r.industryName}</p>
                      <p className={cn("text-[10px] font-semibold", r.industryVerified ? "text-forest dark:text-growth" : "text-settle")}>
                        {r.industryVerified ? "Verified" : "Not verified"}
                      </p>
                    </TD>
                    <TD className="num">{kgToBestDisplay(r.targetKg)}</TD>
                    <TD>
                      <div className="min-w-24">
                        <p className="num text-[11px] font-semibold">{kgToBestDisplay(pool?.committedKg ?? 0)}</p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line dark:bg-portal-line">
                          <div className="h-full rounded-full bg-forest" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </TD>
                    <TD className="num">
                      {formatMoney(r.ratePerUnit)}
                      <span className="text-[10px] text-muted dark:text-portal-muted">/{r.rateUnit}</span>
                    </TD>
                    <TD className="num text-[11px]">{formatDate(r.deadline)}</TD>
                    <TD>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusTone[r.status])}>
                        {r.status}
                      </span>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/portal/pools/${r.poolId}`} className="rounded px-1.5 py-1 text-[11px] font-semibold text-forest dark:text-growth">
                          Pool
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10"
                          onClick={() => {
                            setTarget(r);
                            setReason("");
                            setReasonError(null);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </PortalCard>
      )}

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent variant="center">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-error" /> Remove requirement?
            </DialogTitle>
            <DialogDescription>
              {target && `${WASTE_LABELS[target.wasteType]} · ${target.industryName} · ${kgToBestDisplay(target.targetKg)}`}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="remove-req-reason">Reason (required)</Label>
          <Textarea
            id="remove-req-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(null);
            }}
            placeholder="Explain why this requirement is being removed."
            className="min-h-20"
          />
          <FieldError>{reasonError}</FieldError>
          <p className="mt-2 rounded-lg bg-canvas p-2 text-[11px] leading-relaxed text-muted dark:bg-portal-bg dark:text-portal-muted">
            This removes the requirement record. Existing pool and contribution records are not changed in this demo.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="portal" className="flex-1" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="portal" className="flex-1" onClick={remove} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Remove requirement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
