import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Keyboard,
  Loader2,
  MapPin,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/form";
import { AiChip } from "@/components/shared/Marks";
import { ConversionLine } from "@/components/shared/Numbers";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { aiAssistantService } from "@/services/aiAssistantService";
import { listingService } from "@/services/listingService";
import { collectionService } from "@/services/collectionService";
import { useConnectivity } from "@/lib/connectivity";
import { WASTE_LABELS, LANGUAGES, type ListingDraft, type QtyUnit, type WasteType } from "@/types";
import { cn, daysUntil } from "@/lib/utils";

type Mode = "idle" | "listening" | "typing" | "understanding" | "review" | "saving" | "saved";

interface Notice {
  title: string;
  body: string;
  tone?: "warning" | "error";
}

const DEMO_SENTENCES = {
  husk: "I have 200 kg of rice husk available at this location, 8 rupees per kg.",
  mustard: "I have 3 quintals of mustard stubble in Rewari at 1400 rupees per quintal by 20 April.",
};

export function VoiceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const language = useUi((s) => s.language);
  const pushToast = useUi((s) => s.pushToast);
  const online = useConnectivity();

  const [mode, setMode] = useState<Mode>("idle");
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [selectedPointId, setSelectedPointId] = useState("");
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().slice(0, 10));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const finalRef = useRef("");
  const transcriptRef = useRef("");

  const bcp47 = useMemo(() => LANGUAGES.find((l) => l.code === language)?.bcp47 ?? "en-IN", [language]);

  const { data: points = [] } = useQuery({
    queryKey: ["collection-points", profile?.id],
    queryFn: () => collectionService.list(profile!),
    enabled: open && !!profile,
  });

  const openPoints = points.filter((p) => p.active);

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      listeningRef.current = false;
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    setMode("idle");
    setTranscript("");
    transcriptRef.current = "";
    finalRef.current = "";
    setDraft(null);
    setSelectedPointId("");
    setNotice(null);
    setShowErrors(false);
    setSavedId(null);
    setAvailableFrom(new Date().toISOString().slice(0, 10));
  }, [open]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (mode === "review" && !selectedPointId && openPoints.length > 0) {
      const match = draft?.village ? openPoints.find((p) => p.village === draft.village) : undefined;
      setSelectedPointId((match ?? openPoints[0]).id);
    }
  }, [mode, selectedPointId, openPoints, draft?.village]);

  const updateTranscript = (value: string) => {
    transcriptRef.current = value;
    setTranscript(value);
  };

  const parse = async (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setNotice({ title: t("voice.noSpeech"), body: t("voice.noSpeechBody"), tone: "warning" });
      return;
    }
    setNotice(null);
    setMode("understanding");
    try {
      const d = await aiAssistantService.parseListingText(clean, language);
      setDraft(d);
      setMode("review");
    } catch (e) {
      setMode("typing");
      setNotice({
        title: t("voice.aiTimeout"),
        body: e instanceof Error && e.message ? `${t("voice.aiTimeoutBody")} (${e.message})` : t("voice.aiTimeoutBody"),
        tone: "warning",
      });
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
  };

  const startListening = () => {
    setNotice(null);
    finalRef.current = "";
    updateTranscript("");
    setMode("listening");

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      listeningRef.current = false;
      setMode("typing");
      setNotice({ title: t("voice.unsupported"), body: t("voice.unsupportedBody"), tone: "warning" });
      return;
    }

    try {
      const rec = new SR();
      rec.lang = bcp47;
      rec.continuous = false;
      rec.interimResults = true;
      listeningRef.current = true;
      rec.onresult = (event: any) => {
        let interim = "";
        let final = finalRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) final += `${result[0].transcript} `;
          else interim += result[0].transcript;
        }
        finalRef.current = final;
        updateTranscript(`${final}${interim}`.trim());
      };
      rec.onerror = (event: any) => {
        listeningRef.current = false;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMode("typing");
          setNotice({ title: t("voice.micDenied"), body: t("voice.micDeniedBody"), tone: "warning" });
        } else if (event.error === "no-speech") {
          setMode("typing");
          setNotice({ title: t("voice.noSpeech"), body: t("voice.noSpeechBody"), tone: "warning" });
        } else {
          setMode("typing");
          setNotice({ title: t("voice.unsupported"), body: t("voice.unsupportedBody"), tone: "warning" });
        }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        if (!listeningRef.current) return;
        listeningRef.current = false;
        const text = transcriptRef.current.trim();
        if (text) void parse(text);
        else {
          setMode("typing");
          setNotice({ title: t("voice.noSpeech"), body: t("voice.noSpeechBody"), tone: "warning" });
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      listeningRef.current = false;
      setMode("typing");
      setNotice({ title: t("voice.unsupported"), body: t("voice.unsupportedBody"), tone: "warning" });
    }
  };

  const setField = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const speak = () => {
    if (!draft) return;
    if (!("speechSynthesis" in window)) {
      pushToast({ title: t("voice.ttsUnavailable"), variant: "warning" });
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const parts = [
      draft.wasteType ? WASTE_LABELS[draft.wasteType] : "",
      draft.quantity ? `${draft.quantity} ${draft.unit ?? "kg"}` : "",
      draft.rate ? `${draft.rate} rupees per ${draft.rateUnit ?? "kg"}` : "",
      draft.village ? `at ${draft.village}` : "",
    ].filter(Boolean);
    const utterance = new SpeechSynthesisUtterance(parts.join(", "));
    utterance.lang = bcp47;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const save = async () => {
    if (!profile || !draft) return;
    const missing = !draft.wasteType || !draft.quantity || draft.quantity <= 0 || !draft.rate || draft.rate <= 0 || !selectedPointId;
    if (missing) {
      setShowErrors(true);
      setNotice({ title: t("voice.missingFields"), body: t("voice.missingFieldsBody"), tone: "warning" });
      return;
    }
    if (!online) {
      setNotice({
        title: "You are offline",
        body: "Your draft is saved on this device. Go back online to publish the listing.",
        tone: "warning",
      });
      return;
    }
    setMode("saving");
    setNotice(null);
    try {
      const listing = await listingService.create(profile, { ...draft, availableFrom }, selectedPointId);
      setSavedId(listing.id);
      setMode("saved");
      pushToast({ title: t("voice.saved"), description: t("voice.savedBody"), variant: "success" });
    } catch (e) {
      setMode("review");
      setNotice({
        title: "Could not save the listing",
        body: e instanceof Error ? e.message : "Please try again.",
        tone: "error",
      });
    }
  };

  const reset = () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    listeningRef.current = false;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMode("idle");
    updateTranscript("");
    finalRef.current = "";
    setDraft(null);
    setSelectedPointId("");
    setNotice(null);
    setShowErrors(false);
    setSavedId(null);
  };

  const missing = {
    wasteType: !draft?.wasteType,
    quantity: !draft?.quantity || draft.quantity <= 0,
    rate: !draft?.rate || draft.rate <= 0,
    point: !selectedPointId,
  };
  const anyMissing = missing.wasteType || missing.quantity || missing.rate || missing.point;
  const overallConfidence = draft
    ? Math.round(
        ((draft.confidence.wasteType ?? 0) +
          (draft.confidence.quantity ?? 0) +
          (draft.confidence.rate ?? 0) +
          (draft.confidence.village ?? 0)) /
          4 *
          100
      )
    : 0;

  const inputErrorClass = (bad: boolean) => (showErrors && bad ? "border-error ring-2 ring-error/20" : "");

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : onOpenChange(false))}>
      <DialogContent variant="sheet">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl">{t("voice.title")}</DialogTitle>
          <DialogDescription>
            {mode === "review" || mode === "saving" || mode === "saved"
              ? t("voice.reviewHint")
              : t("voice.listeningHint")}
          </DialogDescription>
        </DialogHeader>

        {notice && (
          <div
            role="alert"
            className={cn(
              "mb-3 flex items-start gap-2 rounded-xl border p-3 text-[13px]",
              notice.tone === "error"
                ? "border-error/40 bg-error/10 text-error"
                : "border-settle/40 bg-settle/10 text-[#92400E]"
            )}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{notice.title}</p>
              <p className="mt-0.5 leading-snug">{notice.body}</p>
            </div>
          </div>
        )}

        {mode === "idle" && (
          <div className="flex flex-col items-center pb-2">
            <div className="relative mt-2 flex h-40 w-40 items-center justify-center">
              <span className="absolute h-36 w-36 rounded-full bg-meadow" aria-hidden="true" />
              <span className="absolute h-28 w-28 rounded-full bg-meadow/80" aria-hidden="true" />
              <button
                type="button"
                onClick={startListening}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-forest text-white shadow-lg transition-transform active:scale-95"
                aria-label={t("voice.title")}
              >
                <Mic className="h-10 w-10" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-ink">{t("voice.tapToStop")}</p>
            <p className="mt-1 text-center text-[12px] text-muted">{t("voice.listeningHint")}</p>

            <div className="mt-5 w-full">
              <Button variant="outline" size="field" className="w-full" onClick={() => setMode("typing")}>
                <Keyboard className="h-5 w-5" /> {t("voice.typeInstead")}
              </Button>
            </div>

            <div className="mt-4 w-full rounded-xl border border-line bg-canvas p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Try a demo sentence</p>
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    updateTranscript(DEMO_SENTENCES.husk);
                    void parse(DEMO_SENTENCES.husk);
                  }}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-left text-[12px] text-ink hover:border-forest/40"
                >
                  “{DEMO_SENTENCES.husk}”
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTranscript(DEMO_SENTENCES.mustard);
                    void parse(DEMO_SENTENCES.mustard);
                  }}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-left text-[12px] text-ink hover:border-forest/40"
                >
                  “{DEMO_SENTENCES.mustard}”
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "listening" && (
          <div className="flex flex-col items-center pb-2">
            <div className="relative mt-2 flex h-40 w-40 items-center justify-center">
              <span className="absolute h-36 w-36 animate-ping rounded-full bg-meadow/70" aria-hidden="true" />
              <span className="absolute h-28 w-28 rounded-full bg-meadow" aria-hidden="true" />
              <button
                type="button"
                onClick={stopListening}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-error text-white shadow-lg"
                aria-label={t("voice.tapToStop")}
              >
                <Square className="h-9 w-9" fill="currentColor" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-sm font-bold text-forest">{t("voice.listening")}</p>
            <p className="mt-1 text-center text-[12px] text-muted">{t("voice.listeningHint")}</p>

            <div className="mt-4 min-h-[76px] w-full rounded-xl border-[1.5px] border-dashed border-forest/30 bg-meadow/30 p-3 text-[15px] leading-relaxed text-ink">
              {transcript || <span className="text-muted">…</span>}
            </div>

            <Button variant="ghost" size="field" className="mt-3 w-full" onClick={stopListening}>
              <Square className="h-4 w-4" /> {t("voice.tapToStop")}
            </Button>
          </div>
        )}

        {mode === "understanding" && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-ai" aria-hidden="true" />
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ai">
              <Sparkles className="h-4 w-4" /> {t("voice.understanding")}
            </p>
            <p className="mt-2 max-w-xs text-center text-[12px] text-muted">“{transcript}”</p>
          </div>
        )}

        {mode === "typing" && (
          <div>
            <Label htmlFor="voice-typed">{t("voice.typeTitle")}</Label>
            <Textarea
              id="voice-typed"
              value={transcript}
              onChange={(e) => updateTranscript(e.target.value)}
              placeholder={t("voice.typePlaceholder")}
              className="min-h-32"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={startListening}>
                <Mic className="h-4 w-4" /> {t("common.voice")}
              </Button>
              <span className="text-[11px] text-muted">You can edit every field after this step.</span>
            </div>
            <Button
              variant="primary"
              size="field"
              className="mt-3 w-full"
              onClick={() => void parse(transcript)}
              disabled={!transcript.trim()}
            >
              <Sparkles className="h-5 w-5" /> {t("voice.parse")}
            </Button>
          </div>
        )}

        {(mode === "review" || mode === "saving") && draft && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-ai/25 bg-aitint px-3 py-2">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#4b3f97]">
                <AiChip kind="suggested" className="border-0 bg-transparent px-0 py-0">
                  {t("common.aiSuggested")}
                </AiChip>
              </span>
              <span className="num text-[12px] font-bold text-[#4b3f97]">
                {t("voice.confidence")}: {overallConfidence}%
              </span>
            </div>

            <div>
              <Label htmlFor="draft-waste">{t("voice.wasteType")}</Label>
              <Select
                id="draft-waste"
                value={draft.wasteType ?? ""}
                onChange={(e) => setField("wasteType", (e.target.value || undefined) as WasteType | undefined)}
                className={inputErrorClass(missing.wasteType)}
              >
                <option value="">{t("voice.chooseWaste")}</option>
                {Object.entries(WASTE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              {showErrors && missing.wasteType && <FieldError>{t("voice.pleaseCheck")}</FieldError>}
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div>
                <Label htmlFor="draft-qty">{t("voice.quantityLabel")}</Label>
                <Input
                  id="draft-qty"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={draft.quantity ?? ""}
                  onChange={(e) => setField("quantity", e.target.value ? Number(e.target.value) : undefined)}
                  className={cn("num", inputErrorClass(missing.quantity))}
                  placeholder={t("voice.quantityPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="draft-unit">{t("common.quantity")}</Label>
                <Select
                  id="draft-unit"
                  value={draft.unit ?? "kg"}
                  onChange={(e) => setField("unit", e.target.value as QtyUnit)}
                >
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                  <option value="tonne">tonne</option>
                </Select>
              </div>
            </div>
            {draft.quantity ? (
              <ConversionLine value={draft.quantity} unit={draft.unit ?? "kg"} className="-mt-1 block" />
            ) : null}
            {showErrors && missing.quantity && <FieldError>{t("voice.pleaseCheck")}</FieldError>}

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div>
                <Label htmlFor="draft-rate">{t("voice.rateLabel")}</Label>
                <Input
                  id="draft-rate"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={draft.rate ?? ""}
                  onChange={(e) => setField("rate", e.target.value ? Number(e.target.value) : undefined)}
                  className={cn("num", inputErrorClass(missing.rate))}
                  placeholder={t("voice.ratePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="draft-rate-unit">Per</Label>
                <Select
                  id="draft-rate-unit"
                  value={draft.rateUnit ?? "kg"}
                  onChange={(e) => setField("rateUnit", e.target.value as QtyUnit)}
                >
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                  <option value="tonne">tonne</option>
                </Select>
              </div>
            </div>
            {showErrors && missing.rate && <FieldError>{t("voice.pleaseCheck")}</FieldError>}

            <div>
              <Label htmlFor="draft-point">{t("voice.pickupLocation")}</Label>
              <Select
                id="draft-point"
                value={selectedPointId}
                onChange={(e) => setSelectedPointId(e.target.value)}
                className={inputErrorClass(missing.point)}
              >
                <option value="">{t("voice.selectPoint")}</option>
                {openPoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.village} ({p.distanceKm.toFixed(0)} km)
                  </option>
                ))}
              </Select>
              {showErrors && missing.point && <FieldError>{t("voice.pleaseCheck")}</FieldError>}
            </div>

            <div>
              <Label htmlFor="draft-date">{t("voice.availableFrom")}</Label>
              <Input
                id="draft-date"
                type="date"
                value={availableFrom}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
              {availableFrom && daysUntil(availableFrom) < 0 && (
                <FieldError>Choose today or a future date.</FieldError>
              )}
            </div>

            <div className="rounded-xl border border-line bg-canvas p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">What you said</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink">“{draft.rawText}”</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="field" onClick={speak} aria-label={speaking ? t("voice.stopReading") : t("voice.readAloud")}>
                {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="field" onClick={reset} aria-label={t("voice.sayAgain")}>
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="primary"
                size="field"
                className="flex-1"
                onClick={save}
                disabled={mode === "saving" || !online}
              >
                {mode === "saving" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                {t("voice.confirmAndList")}
              </Button>
            </div>
            {!online && (
              <p className="text-center text-[11px] font-semibold text-settle">
                Offline: your draft is kept. Reconnect to publish.
              </p>
            )}
            {anyMissing && !showErrors && (
              <p className="text-center text-[11px] text-muted">{t("voice.reviewHint")}</p>
            )}
          </div>
        )}

        {mode === "saved" && (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-forest" aria-hidden="true" />
            <p className="mt-3 text-lg font-bold text-ink">{t("voice.saved")}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">{t("voice.savedBody")}</p>
            <div className="mt-5 flex w-full gap-2">
              <Button variant="outline" size="field" className="flex-1" onClick={() => onOpenChange(false)}>
                {t("common.done")}
              </Button>
              <Button
                variant="primary"
                size="field"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  if (savedId) navigate(`/app/market/${savedId}`);
                  else navigate("/app/listings");
                }}
              >
                {t("voice.viewListing")}
              </Button>
            </div>
          </div>
        )}

        {mode === "review" && draft?.village && (
          <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted">
            <MapPin className="h-3.5 w-3.5" /> {draft.village}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
