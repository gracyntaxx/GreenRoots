import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, FileText, Flag, History, Loader2, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { adminService } from "@/services/adminService";
import { PortalPageHeader } from "@/components/shared/PageHeader";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea, FieldError } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import type { IndustryVerification } from "@/types";
import { PageContainer } from "@/components/shared/PageContainer";

export default function VerificationPage() {
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();

  const verifications = useQuery({ queryKey: ["verifications"], queryFn: () => adminService.verifications() });
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const list = verifications.data ?? [];
    return filter === "pending" ? list.filter((v) => v.status === "Pending") : list;
  }, [verifications.data, filter]);

  const selected = (verifications.data ?? []).find((v) => v.id === selectedId) ?? null;

  const decide = async (v: IndustryVerification, decision: "Verified" | "Rejected") => {
    if (decision === "Rejected" && !reason.trim()) {
      setReasonError("A rejection reason is required.");
      return;
    }
    setBusy(true);
    try {
      await adminService.decideVerification(v.id, decision, decision === "Rejected" ? reason : undefined);
      pushToast({
        title: decision === "Verified" ? "Industry verified" : "Verification rejected",
        description: `${v.businessName} · ${decision}`,
        variant: decision === "Verified" ? "success" : "warning",
      });
      qc.invalidateQueries({ queryKey: ["verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      setApproveOpen(false);
      setRejectOpen(false);
      setSelectedId(null);
      setReason("");
      setReasonError(null);
    } catch (e) {
      pushToast({ title: "Could not save decision", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer className="space-y-6">
      <div className="border-b border-line/80 pb-5 dark:border-portal-line">
        <span className="eyebrow mb-2">Governance & Compliance</span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-moss dark:text-portal-ink">
          Admin Moderation & Governance
        </h1>
        <p className="mt-1 text-sm text-muted dark:text-portal-muted">
          Review pending industry business licences, audit AI-flagged listings, manage collection hubs, and inspect tamper-evident audit logs.
        </p>

        {/* High-Clarity Governance Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { to: "/portal/admin/verification", label: "Industry Accounts", icon: ShieldCheck, active: true },
            { to: "/portal/admin/moderation", label: "AI-Flagged Listings", icon: Flag, active: false },
            { to: "/portal/admin/collection-points", label: "Collection Points", icon: MapPin, active: false },
            { to: "/portal/admin/audit", label: "Transaction Audit Log", icon: History, active: false },
          ].map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs",
                tab.active
                  ? "bg-forest text-white"
                  : "bg-surface border border-line text-muted hover:border-moss hover:text-moss dark:bg-portal-surface dark:border-portal-line"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <PortalPageHeader
        title="Pending Industry Licences"
        description="A human decision is required before an industry can publish requirements. AI may summarise documents, but it never auto-approves."
        actions={
          <div className="flex rounded-portal border border-line bg-surface p-0.5 dark:border-portal-line dark:bg-portal-surface">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 rounded-lg px-3 text-[12px] font-semibold capitalize",
                  filter === f ? "bg-meadow text-forest dark:bg-portal-line dark:text-growth" : "text-muted dark:text-portal-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {verifications.isLoading && <Skeleton className="h-64 w-full" />}

      {!verifications.isLoading && rows.length === 0 && (
        <EmptyState
          icon={<BadgeCheck className="h-7 w-7" />}
          title="Nothing to review"
          body={filter === "pending" ? "No pending industry verifications." : "No verification records."}
        />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((v) => (
          <PortalCard key={v.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold">{v.businessName}</p>
                <p className="num text-[11px] text-muted dark:text-portal-muted">{v.licenseNumber}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted dark:text-portal-muted">{v.registeredAddress}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  v.status === "Verified"
                    ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth"
                    : v.status === "Rejected"
                    ? "bg-error/10 text-error"
                    : "bg-settle/15 text-[#92400E]"
                )}
              >
                {v.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted dark:text-portal-muted">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> {v.documents.length} documents
              </span>
              <span>Submitted {timeAgo(v.submittedAt)}</span>
            </div>
            <Button variant="outline" size="portal" className="mt-3 w-full" onClick={() => setSelectedId(v.id)}>
              Review application
            </Button>
          </PortalCard>
        ))}
      </div>

      <Dialog open={!!selected && !approveOpen} onOpenChange={(v) => !v && setSelectedId(null)}>
        <DialogContent variant="wide">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.businessName}</DialogTitle>
                <DialogDescription>
                  Licence {selected.licenseNumber} · submitted {formatDate(selected.submittedAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-line p-3 dark:border-portal-line">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Registered address</p>
                  <p className="mt-0.5 text-[13px] font-medium">{selected.registeredAddress}</p>
                </div>
                <div className="rounded-lg border border-line p-3 dark:border-portal-line">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Contact person</p>
                  <p className="mt-0.5 text-[13px] font-medium">{selected.contactPerson}</p>
                </div>
              </div>

              <p className="mt-4 text-[12px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Documents</p>
              <div className="mt-1 space-y-1.5">
                {selected.documents.length === 0 && (
                  <p className="rounded-lg bg-canvas p-2.5 text-[12px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                    No documents were attached.
                  </p>
                )}
                {selected.documents.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 rounded-lg border border-line p-2.5 dark:border-portal-line">
                    <FileText className="h-4 w-4 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{d.name}</span>
                    <span className="text-[10px] uppercase text-muted dark:text-portal-muted">{d.type}</span>
                    <span className="text-[10px] text-muted dark:text-portal-muted">{formatDate(d.uploadedAt)}</span>
                  </div>
                ))}
              </div>

              {selected.rejectionReason && (
                <p className="mt-3 rounded-lg bg-error/10 p-2.5 text-[12px] text-error">
                  Previously rejected: {selected.rejectionReason}
                </p>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-canvas p-2.5 text-[11px] leading-relaxed text-muted dark:bg-portal-bg dark:text-portal-muted">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-settle" />
                Check that the licence number and registered address match the documents. AI does not verify documents in
                this demo; your decision is recorded in the audit log.
              </div>

              {selected.status === "Pending" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="primary"
                    size="portal"
                    className="flex-1"
                    onClick={() => {
                      setApproveOpen(true);
                      setRejectOpen(false);
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" /> Approve industry
                  </Button>
                  <Button
                    variant="danger"
                    size="portal"
                    className="flex-1"
                    onClick={() => {
                      setRejectOpen(true);
                      setApproveOpen(false);
                      setReason("");
                      setReasonError(null);
                    }}
                  >
                    Reject with reason
                  </Button>
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-canvas p-2.5 text-[12px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                  This application was already decided: <strong>{selected.status}</strong>.
                </p>
              )}

              {rejectOpen && (
                <div className="mt-3 rounded-lg border border-error/30 p-3">
                  <Label htmlFor="reject-reason">Rejection reason (required)</Label>
                  <Textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReasonError(null);
                    }}
                    placeholder="Explain what is missing or incorrect."
                    className="min-h-20"
                  />
                  <FieldError>{reasonError}</FieldError>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="portal" className="flex-1" onClick={() => setRejectOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="portal"
                      className="flex-1"
                      disabled={busy}
                      onClick={() => decide(selected, "Rejected")}
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm rejection
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {selected && (
        <ConfirmSheet
          open={approveOpen}
          onOpenChange={setApproveOpen}
          variant="center"
          title="Approve this industry?"
          description="The industry can publish requirements immediately. Your decision is recorded in the audit log."
          confirmLabel="Approve industry"
          loading={busy}
          onConfirm={() => decide(selected, "Verified")}
          actor={{ name: profile.name, role: profile.role }}
          facts={[
            { label: "Business", value: selected.businessName },
            { label: "Licence", value: selected.licenseNumber },
            { label: "Contact", value: selected.contactPerson },
            { label: "Documents", value: `${selected.documents.length} attached` },
            { label: "Decision", value: "Verified", emphasis: true },
          ]}
        />
      )}
    </PageContainer>
  );
}
