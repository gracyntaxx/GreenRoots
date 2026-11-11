import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Pause, Pencil, Play, Trash2, FileText } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { useFieldShell } from "@/app/FieldShellContext";
import { listingService, type ListingWithDistance } from "@/services/listingService";
import { RateText, QtyText } from "@/components/shared/Numbers";
import { WasteImage } from "@/components/shared/WasteImage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { WASTE_LABELS, type QtyUnit } from "@/types";
import { cn, timeAgo } from "@/lib/utils";

export default function MyListingsPage() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile)!;
  const qc = useQueryClient();
  const pushToast = useUi((s) => s.pushToast);
  const { openVoice } = useFieldShell();

  const [editing, setEditing] = useState<ListingWithDistance | null>(null);
  const [deleting, setDeleting] = useState<ListingWithDistance | null>(null);
  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0);
  const [unit, setUnit] = useState<QtyUnit>("kg");
  const [busy, setBusy] = useState(false);

  const listings = useQuery({
    queryKey: ["my-listings", profile.id],
    queryFn: () => listingService.list({ farmerId: profile.id, status: "all" }, profile),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-listings", profile.id] });
    qc.invalidateQueries({ queryKey: ["listings"] });
    qc.invalidateQueries({ queryKey: ["listing-picks"] });
  };

  const openEdit = (l: ListingWithDistance) => {
    setEditing(l);
    setQty(l.quantityKg);
    setRate(l.ratePerUnit);
    setUnit(l.rateUnit);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await listingService.update(editing.id, { quantityKg: qty, ratePerUnit: rate, rateUnit: unit });
      pushToast({ title: "Listing updated", variant: "success" });
      setEditing(null);
      refresh();
    } catch (e) {
      pushToast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (l: ListingWithDistance) => {
    try {
      await listingService.update(l.id, { status: l.status === "Active" ? "Paused" : "Active" });
      pushToast({ title: l.status === "Active" ? "Listing paused" : "Listing active again", variant: "info" });
      refresh();
    } catch (e) {
      pushToast({ title: "Could not change status", description: e instanceof Error ? e.message : "", variant: "error" });
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await listingService.remove(deleting.id);
      pushToast({ title: "Listing removed", variant: "info" });
      setDeleting(null);
      refresh();
    } catch (e) {
      pushToast({ title: "Could not remove", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const rows = listings.data ?? [];
  const activeCount = rows.filter((l) => l.status === "Active").length;

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-2 border-b border-line pb-4 dark:border-portal-line">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">My listings</h1>
          <p className="mt-1 text-sm text-muted dark:text-portal-muted">
            {activeCount} active · {rows.length} total
          </p>
        </div>
        <Button variant="secondary" size="portal" onClick={openVoice} className="font-semibold text-forest">
          <Mic className="h-4 w-4" /> New listing
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}

        {!listings.isLoading && rows.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="No listings yet"
              body="Use the microphone to create your first listing. AI will prepare a draft for you to check."
              action={
                <Button variant="secondary" size="sm" onClick={openVoice}>
                  <Mic className="h-4 w-4" /> Speak to sell
                </Button>
              }
            />
          </div>
        )}

        {rows.map((l) => (
          <Card key={l.id} className="p-3.5 transition-shadow hover:shadow-md">
            <div className="flex items-start gap-3">
              <WasteImage
                wasteType={l.wasteType}
                alt={WASTE_LABELS[l.wasteType]}
                className="h-14 w-14 shrink-0 rounded-xl object-cover border border-line dark:border-portal-line"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[15px] font-bold text-ink dark:text-portal-ink">{WASTE_LABELS[l.wasteType]}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          l.status === "Active"
                            ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth"
                            : l.status === "Paused"
                            ? "bg-settle/15 text-[#92400E]"
                            : "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted"
                        )}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted dark:text-portal-muted">
                      Updated {timeAgo(l.updatedAt)} · {l.collectionPointId ? "collection point set" : "no point"}
                    </p>
                  </div>
                  <RateText rate={l.ratePerUnit} unit={l.rateUnit} className="shrink-0 text-[13px] font-bold text-forest dark:text-growth" />
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-canvas px-2.5 py-2 dark:bg-portal-bg">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("common.quantity")}</p>
                <QtyText kg={l.quantityKg} className="text-[14px] font-bold text-ink" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Rate per kg</p>
                <p className="num text-[12px] font-semibold text-ink">₹{l.ratePerKg.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-2.5 flex gap-1.5">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(l)}>
                <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleStatus(l)}>
                {l.status === "Active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {l.status === "Active" ? "Pause" : "Activate"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-error/30 text-error"
                onClick={() => setDeleting(l)}
                aria-label={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent variant="sheet">
          <DialogHeader>
            <DialogTitle>Edit listing</DialogTitle>
            <DialogDescription>
              Changes are visible to buyers immediately. Quantity is shown in kg.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div>
                <Label htmlFor="edit-qty">Quantity (kg)</Label>
                <Input
                  id="edit-qty"
                  type="number"
                  min={1}
                  value={qty || ""}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
                  className="num"
                />
              </div>
              <div>
                <Label htmlFor="edit-rate-unit">Rate unit</Label>
                <Select id="edit-rate-unit" value={unit} onChange={(e) => setUnit(e.target.value as QtyUnit)}>
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                  <option value="tonne">tonne</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-rate">Rate per {unit}</Label>
              <Input
                id="edit-rate"
                type="number"
                min={1}
                value={rate || ""}
                onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
                className="num"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="field" className="flex-1" onClick={() => setEditing(null)}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" size="field" className="flex-1" onClick={saveEdit} disabled={busy || qty <= 0 || rate <= 0}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmSheet
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Remove this listing?"
        description="Buyers will no longer see it. Orders already placed are not affected."
        confirmLabel={t("common.delete")}
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </PageContainer>
  );
}
