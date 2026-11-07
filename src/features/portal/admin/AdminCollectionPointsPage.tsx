import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus } from "lucide-react";
import { useUi } from "@/store/ui";
import { adminService } from "@/services/adminService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { MapView, type MapMarker } from "@/components/shared/MapView";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CollectionPoint } from "@/types";
import { formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";

type FormState = Partial<CollectionPoint> & { id?: string };

const blank: FormState = {
  name: "",
  village: "",
  district: "",
  state: "",
  capacityTonnes: 50,
  hours: "6:00 AM - 6:00 PM",
  active: true,
  location: { lat: 28.61, lng: 77.2 },
};

export default function AdminCollectionPointsPage() {
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const points = useQuery({ queryKey: ["admin-collection-points"], queryFn: () => adminService.collectionPoints() });

  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const all = points.data ?? [];
  const center = form?.location ?? all[0]?.location ?? { lat: 28.61, lng: 77.2 };
  const markers: MapMarker[] = useMemo(
    () =>
      all.map((p) => ({
        id: p.id,
        location: p.location,
        label: p.name,
        detail: `${p.village} · ${p.active ? "Active" : "Inactive"} · ${p.capacityTonnes} t`,
        kind: "collection" as const,
      })),
    [all]
  );

  const save = async () => {
    if (!form) return;
    if (!form.name?.trim() || !form.village?.trim()) {
      setError("Name and village are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminService.saveCollectionPoint(form);
      pushToast({ title: form.id ? "Collection point updated" : "Collection point added", variant: "success" });
      qc.invalidateQueries({ queryKey: ["admin-collection-points"] });
      qc.invalidateQueries({ queryKey: ["collection-points"] });
      setForm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the collection point.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (p: CollectionPoint) => {
    setTogglingId(p.id);
    try {
      await adminService.saveCollectionPoint({ id: p.id, active: !p.active });
      pushToast({ title: p.active ? "Collection point paused" : "Collection point activated", variant: "success" });
      qc.invalidateQueries({ queryKey: ["admin-collection-points"] });
      qc.invalidateQueries({ queryKey: ["collection-points"] });
    } catch (e) {
      pushToast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <PortalPageHeader
        title="Collection points"
        description="Physical drop-off hubs used by farmers and buyers. Inactive points are hidden from suggestions but kept on record."
        actions={
          <Button
            variant="primary"
            size="portal"
            onClick={() => {
              setForm({ ...blank, location: { lat: 28.61, lng: 77.2 } });
              setError(null);
            }}
          >
            <Plus className="h-4 w-4" /> Add point
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total points" value={all.length} icon={<MapPin className="h-5 w-5 text-forest" />} />
        <StatCard label="Active" value={all.filter((p) => p.active).length} tone="success" />
        <StatCard label="Capacity" value={`${formatNumber(all.reduce((s, p) => s + p.capacityTonnes, 0))} t`} sub="Combined daily capacity" />
        <StatCard label="Drop-offs today" value={formatNumber(all.reduce((s, p) => s + p.dropOffsToday, 0))} />
      </div>

      <PortalCard className="mt-4 p-3">
        <MapView center={center} zoom={6} height={260} markers={markers} showLegend />
        <p className="mt-2 text-[11px] text-muted dark:text-portal-muted">
          Click a marker to see the hub. Use Edit to change capacity, hours or active status.
        </p>
      </PortalCard>

      {points.isLoading && <Skeleton className="mt-4 h-64 w-full" />}

      {!points.isLoading && all.length === 0 && (
        <div className="mt-4">
          <EmptyState icon={<MapPin className="h-7 w-7" />} title="No collection points" body="Add the first hub to let farmers drop off waste." />
        </div>
      )}

      {all.length > 0 && (
        <PortalCard className="mt-4 overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Point</TH>
                <TH>Village</TH>
                <TH>Capacity</TH>
                <TH>Hours</TH>
                <TH>Drop-offs today</TH>
                <TH>Active</TH>
                <TH className="text-right">Edit</TH>
              </TR>
            </THead>
            <TBody>
              {all.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <p className="font-semibold">{p.name}</p>
                    <p className="num text-[10px] text-muted dark:text-portal-muted">{p.id}</p>
                  </TD>
                  <TD className="text-[12px]">
                    {p.village}
                    <span className="block text-[10px] text-muted dark:text-portal-muted">
                      {p.district}, {p.state}
                    </span>
                  </TD>
                  <TD className="num">{p.capacityTonnes} t</TD>
                  <TD className="text-[12px]">{p.hours}</TD>
                  <TD className="num">{p.dropOffsToday}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.active}
                        onCheckedChange={() => toggle(p)}
                        disabled={togglingId === p.id}
                        aria-label={`Toggle ${p.name}`}
                      />
                      <span className={cn("text-[11px] font-semibold", p.active ? "text-forest dark:text-growth" : "text-muted dark:text-portal-muted")}>
                        {togglingId === p.id ? "Saving…" : p.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm({ ...p });
                        setError(null);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </PortalCard>
      )}

      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent variant="wide">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit collection point" : "Add collection point"}</DialogTitle>
            <DialogDescription>Changes are visible to farmers immediately after saving.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="cp-name">Name</Label>
                <Input id="cp-name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cp-village">Village</Label>
                <Input id="cp-village" value={form.village ?? ""} onChange={(e) => setForm({ ...form, village: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cp-district">District</Label>
                <Input id="cp-district" value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cp-state">State</Label>
                <Input id="cp-state" value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cp-capacity">Capacity (tonnes)</Label>
                <Input
                  id="cp-capacity"
                  type="number"
                  min={1}
                  value={form.capacityTonnes ?? 50}
                  onChange={(e) => setForm({ ...form, capacityTonnes: Number(e.target.value) })}
                  className="num"
                />
              </div>
              <div>
                <Label htmlFor="cp-hours">Hours</Label>
                <Input id="cp-hours" value={form.hours ?? ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cp-active">Status</Label>
                <Select
                  id="cp-active"
                  value={form.active === false ? "inactive" : "active"}
                  onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="cp-lat">Latitude</Label>
                <Input
                  id="cp-lat"
                  type="number"
                  step="0.0001"
                  value={form.location?.lat ?? 28.61}
                  onChange={(e) =>
                    setForm({ ...form, location: { lat: Number(e.target.value), lng: form.location?.lng ?? 77.2 } })
                  }
                  className="num"
                />
              </div>
              <div>
                <Label htmlFor="cp-lng">Longitude</Label>
                <Input
                  id="cp-lng"
                  type="number"
                  step="0.0001"
                  value={form.location?.lng ?? 77.2}
                  onChange={(e) =>
                    setForm({ ...form, location: { lat: form.location?.lat ?? 28.61, lng: Number(e.target.value) } })
                  }
                  className="num"
                />
              </div>
              <div className="sm:col-span-2">
                <MapView
                  center={form.location ?? center}
                  zoom={8}
                  height={220}
                  markers={[{ id: "edit-point", location: form.location ?? center, label: form.name || "New point", kind: "collection" }]}
                  onMapClick={(p) => setForm({ ...form, location: p })}
                />
                <p className="mt-1 text-[11px] text-muted dark:text-portal-muted">Click the map to set the exact location.</p>
              </div>
            </div>
          )}
          <FieldError>{error}</FieldError>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="portal" className="flex-1" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="portal" className="flex-1" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save point
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
