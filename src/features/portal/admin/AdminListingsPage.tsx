import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic, PackageSearch, Search, Trash2 } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { adminService } from "@/services/adminService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea, FieldError } from "@/components/ui/form";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WasteImage } from "@/components/shared/WasteImage";
import { WASTE_LABELS, type Listing, type WasteType } from "@/types";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { formatDate, cn } from "@/lib/utils";
import { PageContainer } from "@/components/shared/PageContainer";

const statusTone: Record<string, string> = {
  Active: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  Reserved: "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]",
  Sold: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Paused: "bg-settle/15 text-[#92400E]",
};

export default function AdminListingsPage() {
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const listings = useQuery({ queryKey: ["admin-listings"], queryFn: () => adminService.listings() });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Listing["status"] | "all">("all");
  const [waste, setWaste] = useState<WasteType | "all">("all");
  const [target, setTarget] = useState<Listing | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (listings.data ?? []).filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (waste !== "all" && l.wasteType !== waste) return false;
      if (!term) return true;
      return [l.id, l.farmerName, l.village, WASTE_LABELS[l.wasteType]]
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [listings.data, q, status, waste]);

  const all = listings.data ?? [];

  const remove = async () => {
    if (!target) return;
    if (!reason.trim()) {
      setReasonError("A reason is required.");
      return;
    }
    setBusy(true);
    try {
      await adminService.removeListing(target.id, reason);
      pushToast({ title: "Listing removed", description: `${WASTE_LABELS[target.wasteType]} · ${target.farmerName}`, variant: "success" });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      setTarget(null);
      setReason("");
      setReasonError(null);
    } catch (e) {
      pushToast({ title: "Could not remove listing", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PortalPageHeader
        title="Listings"
        description="All farmer listings, including voice-created drafts. Removing a listing requires a reason and is recorded in the audit log."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total listings" value={all.length} icon={<PackageSearch className="h-5 w-5 text-forest" />} />
        <StatCard label="Active" value={all.filter((l) => l.status === "Active").length} tone="success" />
        <StatCard label="Voice-created" value={all.filter((l) => l.source === "voice").length} sub="AI-assisted drafts" icon={<Mic className="h-5 w-5 text-ai" />} />
        <StatCard label="Sold / reserved" value={all.filter((l) => l.status === "Sold" || l.status === "Reserved").length} />
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search farmer, village, waste or listing ID"
            className="min-h-10 rounded-portal pl-9 text-[13px]"
            aria-label="Search listings"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as Listing["status"] | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] lg:w-40"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {["Active", "Reserved", "Sold", "Paused"].map((s) => (
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

      {listings.isLoading && <Skeleton className="mt-3 h-64 w-full" />}

      {!listings.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<PackageSearch className="h-7 w-7" />} title="No listings found" body="Try a different filter." />
        </div>
      )}

      {rows.length > 0 && (
        <PortalCard className="mt-3 overflow-hidden">
          {/* Mobile card stack */}
          <div className="divide-y divide-line sm:hidden dark:divide-portal-line">
            {rows.map((l) => (
              <div key={l.id} className="p-3.5 space-y-2">
                <div className="flex items-start gap-3">
                  <WasteImage
                    wasteType={l.wasteType}
                    alt={WASTE_LABELS[l.wasteType]}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover border border-line dark:border-portal-line"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{WASTE_LABELS[l.wasteType]}</p>
                        <p className="text-xs text-muted dark:text-portal-muted">{l.farmerName} · {l.village}</p>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusTone[l.status])}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted dark:text-portal-muted">Quantity: </span>
                    <span className="num font-semibold">{kgToBestDisplay(l.quantityKg)}</span>
                  </div>
                  <div>
                    <span className="text-muted dark:text-portal-muted">Rate: </span>
                    <span className="num font-semibold">{formatMoney(l.ratePerUnit)}/{l.rateUnit}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-line/60 dark:border-portal-line/60">
                  <span className="inline-flex items-center gap-1 text-[11px] capitalize text-muted dark:text-portal-muted">
                    {l.source === "voice" && <Mic className="h-3 w-3 text-ai" />}
                    {l.source} · {formatDate(l.createdAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/10 text-xs h-7 px-2"
                    onClick={() => {
                      setTarget(l);
                      setReason("");
                      setReasonError(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Listing</TH>
                  <TH>Farmer</TH>
                  <TH>Quantity</TH>
                  <TH>Rate</TH>
                  <TH>Status</TH>
                  <TH>Source</TH>
                  <TH>Created</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((l) => (
                  <TR key={l.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <WasteImage
                          wasteType={l.wasteType}
                          alt={WASTE_LABELS[l.wasteType]}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover border border-line dark:border-portal-line"
                        />
                        <div>
                          <p className="font-semibold">{WASTE_LABELS[l.wasteType]}</p>
                          <p className="num text-[10px] text-muted dark:text-portal-muted">{l.id}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <p className="text-[12px] font-medium">{l.farmerName}</p>
                      <p className="text-[10px] text-muted dark:text-portal-muted">{l.village}</p>
                    </TD>
                    <TD className="num">{kgToBestDisplay(l.quantityKg)}</TD>
                    <TD className="num">
                      {formatMoney(l.ratePerUnit)}
                      <span className="text-[10px] text-muted dark:text-portal-muted">/{l.rateUnit}</span>
                    </TD>
                    <TD>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusTone[l.status])}>
                        {l.status}
                      </span>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center gap-1 text-[11px] capitalize">
                        {l.source === "voice" && <Mic className="h-3 w-3 text-ai" />}
                        {l.source}
                      </span>
                    </TD>
                    <TD className="num text-[11px]">{formatDate(l.createdAt)}</TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:bg-error/10"
                        onClick={() => {
                          setTarget(l);
                          setReason("");
                          setReasonError(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </PortalCard>
      )}

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent variant="center">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-error" /> Remove listing?
            </DialogTitle>
            <DialogDescription>
              {target && `${WASTE_LABELS[target.wasteType]} · ${target.farmerName} · ${kgToBestDisplay(target.quantityKg)}`}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="remove-listing-reason">Reason (required)</Label>
          <Textarea
            id="remove-listing-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(null);
            }}
            placeholder="Explain why this listing is being removed."
            className="min-h-20"
          />
          <FieldError>{reasonError}</FieldError>
          <p className="mt-2 rounded-lg bg-canvas p-2 text-[11px] leading-relaxed text-muted dark:bg-portal-bg dark:text-portal-muted">
            The removal reason is recorded in the permanent audit trail with your administrator credentials.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="portal" className="flex-1" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="portal" className="flex-1" onClick={remove} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Remove listing
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted dark:text-portal-muted">
            Acting as <strong className="text-ink dark:text-portal-ink">{profile.name}</strong>.
          </p>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
