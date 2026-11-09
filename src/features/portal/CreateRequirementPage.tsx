import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { authService } from "@/services/authService";
import { aiAssistantService } from "@/services/aiAssistantService";
import { requirementService } from "@/services/requirementService";
import { collectionService } from "@/services/collectionService";
import { PortalPageHeader } from "@/components/shared/PageHeader";
import { PageContainer } from "@/components/shared/PageContainer";
import { MapView } from "@/components/shared/MapView";
import { AiChip, VerifiedMark } from "@/components/shared/Marks";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { generateHexGrid, farmersInHex } from "@/lib/hex";
import { useConnectivity } from "@/lib/connectivity";
import { WASTE_LABELS, type QtyUnit, type RequirementDraft, type WasteType } from "@/types";
import { formatNumber } from "@/lib/money";

const DEMO = "We need 500 tonnes of paddy straw in Panipat by 15 May at 2300 rupees per tonne.";

export default function CreateRequirementPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const online = useConnectivity();

  const [text, setText] = useState("");
  const [draft, setDraft] = useState<RequirementDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [radiusKm, setRadiusKm] = useState(35);

  const verification = authService.getIndustryVerification(profile.id);
  const verified = verification?.status === "Verified";

  const points = useQuery({
    queryKey: ["collection-points", profile.id],
    queryFn: () => collectionService.list(profile),
  });

  const location = useMemo(() => {
    const village = draft?.village ?? profile.village;
    return (points.data ?? []).find((p) => p.village === village)?.location ?? profile.location;
  }, [draft?.village, profile.village, profile.location, points.data]);

  const hexCells = useMemo(() => generateHexGrid(location, Math.max(8, radiusKm / 2.5), 2), [location, radiusKm]);
  const reach = useMemo(() => {
    let ring1 = 0;
    let ring2 = 0;
    for (const c of hexCells) {
      const n = farmersInHex(c.id, c.ring);
      if (c.ring === 1) ring1 += n;
      else ring2 += n;
    }
    return { ring1, ring2 };
  }, [hexCells]);

  const parse = async () => {
    setError(null);
    setLoading(true);
    try {
      const d = await aiAssistantService.parseRequirementText(text);
      setDraft(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that sentence.");
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof RequirementDraft>(key: K, value: RequirementDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const missing = {
    wasteType: !draft?.wasteType,
    quantity: !draft?.quantity || draft.quantity <= 0,
    rate: !draft?.rate || draft.rate <= 0,
    village: !draft?.village,
    deadline: !draft?.deadline,
  };
  const anyMissing = Object.values(missing).some(Boolean);

  const publish = async () => {
    if (!draft) return;
    if (!verified) {
      pushToast({ title: "Verification required", description: "An admin must verify your licence first.", variant: "warning" });
      return;
    }
    setShowErrors(true);
    if (anyMissing) {
      setError("Some details are missing. Fill the marked fields.");
      return;
    }
    if (!online) {
      setError("You are offline. Reconnect to publish.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const result = await requirementService.create(profile, {
        ...draft,
        village: draft.village,
        location,
      });
      setConfirmOpen(false);
      pushToast({ title: "Requirement published", description: "A pool is now open for nearby farmers.", variant: "success" });
      qc.invalidateQueries({ queryKey: ["requirements"] });
      qc.invalidateQueries({ queryKey: ["pools"] });
      navigate(`/portal/pools/${result.poolId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish the requirement.");
    } finally {
      setPublishing(false);
    }
  };

  const inputError = (bad: boolean) => (showErrors && bad ? "border-error ring-2 ring-error/20" : "");

  return (
    <PageContainer>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest dark:text-portal-muted dark:hover:text-growth"
      >
        <ArrowLeft className="h-4 w-4" /> Back to requirements
      </button>

      <PortalPageHeader
        title="New requirement"
        description="Describe what you need in plain words. AI prepares a structured draft; you review and confirm every field."
        actions={
          verified ? (
            <VerifiedMark label="Licence verified" />
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-settle/40 bg-settle/10 px-2.5 py-1 text-[12px] font-semibold text-[#92400E]">
              <AlertTriangle className="h-3.5 w-3.5" /> Verification pending
            </span>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <PortalCard className="p-4">
            <Label htmlFor="req-text" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-ai" /> Describe your requirement
            </Label>
            <Textarea
              id="req-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={DEMO}
              className="min-h-28"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="ai" size="portal" onClick={parse} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Prepare draft
              </Button>
              <Button
                variant="ghost"
                size="portal"
                onClick={() => {
                  setText(DEMO);
                  setError(null);
                }}
              >
                Use demo sentence
              </Button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted dark:text-portal-muted">
              Example: “We need 500 tonnes of paddy straw in Panipat by 15 May at 2300 rupees per tonne.”
            </p>
            <FieldError>{error}</FieldError>
          </PortalCard>

          {draft && (
            <PortalCard className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold">Review the draft</p>
                <AiChip>{draft.confidence.wasteType && draft.confidence.wasteType > 0.5 ? "AI suggested" : "Check carefully"}</AiChip>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="req-waste">Waste type</Label>
                  <Select
                    id="req-waste"
                    value={draft.wasteType ?? ""}
                    onChange={(e) => setField("wasteType", (e.target.value || undefined) as WasteType | undefined)}
                    className={inputError(missing.wasteType)}
                  >
                    <option value="">Choose waste</option>
                    {Object.entries(WASTE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="req-village">Village / plant location</Label>
                  <Select
                    id="req-village"
                    value={draft.village ?? ""}
                    onChange={(e) => setField("village", e.target.value || undefined)}
                    className={inputError(missing.village)}
                  >
                    <option value="">Choose village</option>
                    {[...new Set((points.data ?? []).map((p) => p.village))].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="req-qty">Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      id="req-qty"
                      type="number"
                      min={1}
                      value={draft.quantity ?? ""}
                      onChange={(e) => setField("quantity", e.target.value ? Number(e.target.value) : undefined)}
                      className={`num ${inputError(missing.quantity)}`}
                    />
                    <Select
                      value={draft.unit ?? "tonne"}
                      onChange={(e) => setField("unit", e.target.value as QtyUnit)}
                      className="w-32"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="tonne">tonne</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="req-rate">Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      id="req-rate"
                      type="number"
                      min={1}
                      value={draft.rate ?? ""}
                      onChange={(e) => setField("rate", e.target.value ? Number(e.target.value) : undefined)}
                      className={`num ${inputError(missing.rate)}`}
                    />
                    <Select
                      value={draft.rateUnit ?? "tonne"}
                      onChange={(e) => setField("rateUnit", e.target.value as QtyUnit)}
                      className="w-32"
                    >
                      <option value="kg">per kg</option>
                      <option value="quintal">per quintal</option>
                      <option value="tonne">per tonne</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="req-deadline">Deadline</Label>
                  <Input
                    id="req-deadline"
                    type="date"
                    value={draft.deadline ? draft.deadline.slice(0, 10) : ""}
                    onChange={(e) =>
                      setField("deadline", e.target.value ? new Date(`${e.target.value}T18:00:00`).toISOString() : undefined)
                    }
                    className={inputError(missing.deadline)}
                  />
                </div>
                <div>
                  <Label htmlFor="req-notes">Notes (optional)</Label>
                  <Input
                    id="req-notes"
                    value={draft.notes ?? ""}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="e.g. moisture below 18%"
                  />
                </div>
              </div>

              {showErrors && anyMissing && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-error">
                  <AlertTriangle className="h-3.5 w-3.5" /> Fill the highlighted fields to publish.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 dark:border-portal-line sm:flex-row">
                <Button
                  variant="primary"
                  size="portal"
                  className="sm:flex-1"
                  disabled={!verified || publishing || !online}
                  onClick={() => {
                    setShowErrors(true);
                    if (anyMissing) {
                      setError("Some details are missing. Fill the marked fields.");
                      return;
                    }
                    setConfirmOpen(true);
                  }}
                >
                  <Send className="h-4 w-4" /> Publish requirement
                </Button>
                <Button variant="outline" size="portal" onClick={() => setDraft(null)}>
                  Discard draft
                </Button>
              </div>
              {!verified && (
                <p className="mt-2 rounded-lg bg-settle/10 p-2 text-[11px] leading-relaxed text-[#92400E]">
                  Publish is disabled until an admin verifies your licence. The reason is shown here, not hidden.
                </p>
              )}
              {!online && <p className="mt-2 text-[11px] font-semibold text-settle">Reconnect to publish.</p>}
            </PortalCard>
          )}
        </div>

        <div className="space-y-4">
          <PortalCard className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-bold">Farmer reach preview</p>
              <span className="num text-[12px] font-semibold text-forest dark:text-growth">{radiusKm} km</span>
            </div>
            <Slider
              min={20}
              max={70}
              step={5}
              value={[radiusKm]}
              onValueChange={([v]) => setRadiusKm(v)}
              aria-label="Notification radius"
            />
            <p className="mt-1 text-[11px] text-muted dark:text-portal-muted">
              Initial area (ring 1) and expansion area (ring 2). Hexagons are a visual aid, not a promise.
            </p>

            <div className="mt-3">
              <MapView
                center={location}
                zoom={8}
                height={260}
                hexCells={hexCells}
                markers={[{ id: "req-loc", location, label: "Requirement location", detail: draft?.village ?? profile.village, kind: "industry" }]}
                showLegend
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-meadow/60 p-2.5 dark:bg-[#123524]">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forest dark:text-growth">
                  <Users className="h-3 w-3" /> Initial area
                </p>
                <p className="num mt-0.5 text-lg font-bold text-ink dark:text-portal-ink">{formatNumber(reach.ring1)}</p>
                <p className="text-[10px] text-muted dark:text-portal-muted">farmers estimated</p>
              </div>
              <div className="rounded-lg bg-[#E0EAFF] p-2.5 dark:bg-[#101E36]">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-navy dark:text-[#8FB4FF]">
                  <Users className="h-3 w-3" /> Expansion area
                </p>
                <p className="num mt-0.5 text-lg font-bold text-ink dark:text-portal-ink">{formatNumber(reach.ring2)}</p>
                <p className="text-[10px] text-muted dark:text-portal-muted">more farmers available</p>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
              <MapPin className="h-3.5 w-3.5" /> {draft?.village ?? profile.village}
            </p>
          </PortalCard>

          <PortalCard className="p-4">
            <p className="text-[13px] font-bold">How publishing works</p>
            <ol className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-muted dark:text-portal-muted">
              <li>1. You confirm the structured requirement.</li>
              <li>2. A pool opens and nearby farmers see it.</li>
              <li>3. You approve area expansion if the pool needs more supply.</li>
              <li>4. You pay the pool through PayPal Sandbox after delivery is verified.</li>
            </ol>
          </PortalCard>
        </div>
      </div>

      {draft && (
        <ConfirmSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          variant="center"
          title="Publish this requirement?"
          description="This opens a pool that farmers can commit to. You can still expand the area or extend the deadline later."
          confirmLabel="Publish requirement"
          loading={publishing}
          onConfirm={publish}
          actor={{ name: profile.name, role: profile.role }}
          facts={[
            { label: "Waste", value: draft.wasteType ? WASTE_LABELS[draft.wasteType] : "—" },
            { label: "Quantity", value: `${formatNumber(draft.quantity ?? 0)} ${draft.unit ?? "tonne"}` },
            { label: "Rate", value: `₹${formatNumber(draft.rate ?? 0)} / ${draft.rateUnit ?? "tonne"}` },
            { label: "Village", value: draft.village ?? "—" },
            { label: "Deadline", value: draft.deadline ? new Date(draft.deadline).toLocaleDateString("en-IN") : "—" },
            { label: "Notification radius", value: `${radiusKm} km`, emphasis: true },
          ]}
        />
      )}
    </PageContainer>
  );
}
