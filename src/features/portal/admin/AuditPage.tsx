import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Search, ShieldCheck, Leaf, UserCheck } from "lucide-react";
import { auditService } from "@/services/auditService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { PortalCard } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AiChip } from "@/components/shared/Marks";
import { ROLE_LABELS, type AiActionAudit, type Role } from "@/types";
import { timeAgo, formatDateTime, cn } from "@/lib/utils";
import { PageContainer } from "@/components/shared/PageContainer";

const roleTone: Record<Role, string> = {
  farmer: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  buyer: "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]",
  industry: "bg-aitint text-[#4b3f97]",
  admin: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
};

export default function AuditPage() {
  const audit = useQuery({ queryKey: ["audit"], queryFn: () => auditService.list() });
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [selected, setSelected] = useState<AiActionAudit | null>(null);

  const all = audit.data ?? [];
  const dayAgo = Date.now() - 24 * 3600 * 1000;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((a) => {
      if (role !== "all" && a.actorRole !== role) return false;
      if (!term) return true;
      return [a.action, a.actor, a.aiPreparedSummary, a.reference, a.outcome, a.confirmedBy]
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [all, q, role]);

  return (
    <PageContainer>
      <PortalPageHeader
        title="AI audit log"
        description="Every AI-prepared action, the human who confirmed it, and the recorded outcome. This is the accountability trail."
        actions={<AiChip kind="explanation">AI prepared · human confirmed</AiChip>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total actions" value={all.length} icon={<ScrollText className="h-5 w-5 text-forest" />} />
        <StatCard label="Human confirmations" value={all.filter((a) => a.confirmedBy.trim().length > 0).length} sub="No action without a person" tone="success" icon={<UserCheck className="h-5 w-5 text-growth" />} />
        <StatCard label="Admin decisions" value={all.filter((a) => a.actorRole === "admin").length} icon={<ShieldCheck className="h-5 w-5 text-navy" />} />
        <StatCard label="Last 24 hours" value={all.filter((a) => new Date(a.at).getTime() > dayAgo).length} icon={<Leaf className="h-5 w-5 text-forest" />} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, actor, reference or outcome"
            className="min-h-10 rounded-portal pl-9 text-[13px]"
            aria-label="Search audit log"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as Role | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] sm:w-44"
          aria-label="Filter by actor role"
        >
          <option value="all">All actor roles</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {audit.isLoading && <Skeleton className="mt-3 h-64 w-full" />}

      {!audit.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<ScrollText className="h-7 w-7" />} title="No audit entries" body="Nothing matches this filter." />
        </div>
      )}

      {rows.length > 0 && (
        <PortalCard className="mt-3 overflow-hidden">
          {/* Mobile card stack */}
          <div className="divide-y divide-line sm:hidden dark:divide-portal-line">
            {rows.map((a) => (
              <div key={a.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{a.action}</p>
                    <p className="text-xs text-muted dark:text-portal-muted">{a.actor} ({ROLE_LABELS[a.actorRole]})</p>
                  </div>
                  <span className="num text-xs text-muted dark:text-portal-muted">{timeAgo(a.at)}</span>
                </div>
                <p className="line-clamp-2 text-xs text-ink/80 dark:text-portal-ink/80 rounded bg-canvas p-2 dark:bg-portal-bg">
                  <span className="font-semibold text-ai">AI: </span>{a.aiPreparedSummary}
                </p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-line/60 dark:border-portal-line/60">
                  <span className="text-muted dark:text-portal-muted truncate max-w-[200px]">Outcome: {a.outcome}</span>
                  <button
                    type="button"
                    onClick={() => setSelected(a)}
                    className="font-semibold text-forest dark:text-growth shrink-0"
                  >
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Actor</TH>
                  <TH>AI prepared</TH>
                  <TH>Action</TH>
                  <TH>Reference</TH>
                  <TH>Outcome</TH>
                  <TH className="text-right">Details</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((a) => (
                  <TR key={a.id}>
                    <TD className="whitespace-nowrap text-[11px]">
                      <span title={formatDateTime(a.at)}>{timeAgo(a.at)}</span>
                    </TD>
                    <TD>
                      <p className="text-[12px] font-semibold">{a.actor}</p>
                      <span className={cn("mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", roleTone[a.actorRole])}>
                        {ROLE_LABELS[a.actorRole]}
                      </span>
                    </TD>
                    <TD className="max-w-64">
                      <p className="line-clamp-2 text-[12px]">{a.aiPreparedSummary}</p>
                    </TD>
                    <TD className="text-[12px] font-medium">{a.action}</TD>
                    <TD className="num max-w-44 truncate text-[11px]">{a.reference}</TD>
                    <TD className="text-[12px]">{a.outcome}</TD>
                    <TD className="text-right">
                      <button type="button" onClick={() => setSelected(a)} className="text-[12px] font-semibold text-forest dark:text-growth">
                        View
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </PortalCard>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-portal border border-line bg-surface p-3 text-[11px] leading-relaxed text-muted dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest dark:text-growth" />
        <p>
          The audit log is append-only in this demo. AI suggestions are shown next to the person who confirmed them; a
          suggestion is never recorded as an action by itself.
        </p>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent variant="center" className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.action}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selected.at)} · {selected.actor} ({ROLE_LABELS[selected.actorRole]})
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-[#D9D2F7] bg-aitint p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-forest">
                  <Leaf className="h-3.5 w-3.5" /> AI prepared
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#4b3f97]">{selected.aiPreparedSummary}</p>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-meadow p-3 dark:bg-[#123524]">
                <UserCheck className="h-4 w-4 text-forest dark:text-growth" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-forest dark:text-growth">Confirmed by</p>
                  <p className="text-[13px] font-semibold text-forest dark:text-growth">{selected.confirmedBy}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-2 rounded-lg bg-canvas p-3 text-[12px] dark:bg-portal-bg">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted dark:text-portal-muted">Reference</dt>
                  <dd className="num break-all text-right font-semibold">{selected.reference}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted dark:text-portal-muted">Outcome</dt>
                  <dd className="text-right font-semibold">{selected.outcome}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted dark:text-portal-muted">Recorded</dt>
                  <dd className="num text-right font-semibold">{formatDateTime(selected.at)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-muted dark:text-portal-muted">
                This entry shows what AI prepared and what a human confirmed. It is not an automatic decision.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
