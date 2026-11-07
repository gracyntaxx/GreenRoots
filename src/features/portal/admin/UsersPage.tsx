import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Search, ShieldAlert, Users } from "lucide-react";
import { adminService } from "@/services/adminService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { ReputationBadge } from "@/components/shared/ReputationBadge";
import { PortalCard } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROLE_LABELS, type Profile, type Role } from "@/types";
import { formatDate, cn } from "@/lib/utils";

const roleTone: Record<Role, string> = {
  farmer: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  buyer: "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]",
  industry: "bg-aitint text-[#4b3f97]",
  admin: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
};

export default function UsersPage() {
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => adminService.users() });
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [selected, setSelected] = useState<Profile | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users.data ?? []).filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!term) return true;
      return [u.name, u.village, u.district, u.state, u.phone, u.email, u.id]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    });
  }, [users.data, q, role]);

  const all = users.data ?? [];

  return (
    <div>
      <PortalPageHeader
        title="Users"
        description="Farmer, buyer, industry and admin accounts. Read-only view; verification and moderation are handled in their own queues."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={all.length} icon={<Users className="h-5 w-5 text-forest" />} />
        <StatCard label="Farmers" value={all.filter((u) => u.role === "farmer").length} tone="success" />
        <StatCard label="Industry accounts" value={all.filter((u) => u.role === "industry").length} icon={<BadgeCheck className="h-5 w-5 text-navy" />} />
        <StatCard
          label="Unverified"
          value={all.filter((u) => !u.verified).length}
          sub="Mostly industries awaiting review"
          tone={all.some((u) => !u.verified) ? "warning" : "default"}
          icon={<ShieldAlert className="h-5 w-5 text-settle" />}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, village, phone, email or ID"
            className="min-h-10 rounded-portal pl-9 text-[13px]"
            aria-label="Search users"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as Role | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] sm:w-48"
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {users.isLoading && <Skeleton className="mt-3 h-64 w-full" />}

      {!users.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<Users className="h-7 w-7" />} title="No users found" body="Try a different search or role filter." />
        </div>
      )}

      {rows.length > 0 && (
        <PortalCard className="mt-3 overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>User</TH>
                <TH>Role</TH>
                <TH>Location</TH>
                <TH>Reputation</TH>
                <TH>Payout readiness</TH>
                <TH>Joined</TH>
                <TH className="text-right">Details</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-meadow text-[11px] font-bold text-forest dark:bg-[#123524] dark:text-growth">
                        {u.avatarInitials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{u.name}</p>
                        <p className="truncate text-[11px] text-muted dark:text-portal-muted">{u.phone ?? u.email ?? u.id}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", roleTone[u.role])}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </TD>
                  <TD className="text-[12px]">
                    {u.village}
                    <span className="block text-[10px] text-muted dark:text-portal-muted">{u.state}</span>
                  </TD>
                  <TD>
                    <ReputationBadge score={u.reputation} factors={u.reputationFactors} size="sm" />
                  </TD>
                  <TD className="text-[12px]">{u.payoutReadiness}</TD>
                  <TD className="num text-[12px]">{formatDate(u.joined)}</TD>
                  <TD className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(u)}
                      className="text-[12px] font-semibold text-forest dark:text-growth"
                    >
                      View
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </PortalCard>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent variant="center" className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {ROLE_LABELS[selected.role]} · {selected.village}, {selected.state}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Phone</p>
                  <p className="num text-[12px] font-medium">{selected.phone ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Email</p>
                  <p className="break-all text-[12px] font-medium">{selected.email ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Verified</p>
                  <p className="text-[12px] font-semibold">{selected.verified ? "Yes" : "No"}</p>
                </div>
                <div className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Payout readiness</p>
                  <p className="text-[12px] font-semibold">{selected.payoutReadiness}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-canvas p-2.5 dark:bg-portal-bg">
                <span className="text-[12px] font-medium text-muted dark:text-portal-muted">Reputation</span>
                <ReputationBadge score={selected.reputation} factors={selected.reputationFactors} showScore />
              </div>
              {selected.reputationFactors.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {selected.reputationFactors.map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="text-muted dark:text-portal-muted">{f.label}</span>
                      <span className="num font-semibold">{f.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] text-muted dark:text-portal-muted">
                Joined {formatDate(selected.joined)} · ID {selected.id}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
