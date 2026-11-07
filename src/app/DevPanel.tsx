import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bug, RotateCcw, WifiOff } from "lucide-react";
import { useUi } from "@/store/ui";
import { useSession } from "@/store/session";
import { useDraft } from "@/store/draft";
import { getMockConfig, resetMockState, setMockConfig } from "@/mocks/store";
import { notifyConnectivityChange } from "@/lib/connectivity";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export function DevPanel() {
  const open = useUi((s) => s.devPanelOpen);
  const setOpen = useUi((s) => s.setDevPanelOpen);
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const setProfile = useSession((s) => s.setProfile);
  const clearDrafts = useDraft((s) => s.clearDrafts);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen(!useUi.getState().devPanelOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const config = getMockConfig();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open developer panel"
        className="fixed bottom-3 right-3 z-[90] flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/90 text-muted shadow hover:text-ink"
        title="Developer panel (Ctrl+Shift+D)"
      >
        <Bug className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed bottom-14 right-3 z-[95] w-[300px] rounded-xl border-[1.5px] border-line bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Developer panel</p>
            <span className="rounded-full bg-aitint px-2 py-0.5 text-[10px] font-bold text-ai">MOCKS ON</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="failure-rate" className="text-[13px] font-semibold text-ink">
                  Simulated failures
                </label>
                <span className="num text-[12px] font-bold text-muted">{Math.round(config.failureRate * 100)}%</span>
              </div>
              <Slider
                id="failure-rate"
                min={0}
                max={1}
                step={0.1}
                value={[config.failureRate]}
                onValueChange={([v]) => {
                  setMockConfig({ failureRate: v });
                }}
                aria-label="Simulated failure rate"
              />
              <p className="text-[11px] text-muted">Occasionally makes a mock request time out.</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <WifiOff className="h-4 w-4" /> Simulate offline
              </span>
              <Switch
                checked={config.offline}
                onCheckedChange={(v) => {
                  setMockConfig({ offline: v });
                  notifyConnectivityChange();
                  pushToast({
                    title: v ? "Offline mode on" : "Back online",
                    description: v
                      ? "Cached data is shown. Commit, order and pay are disabled."
                      : "Live mock round trips are available again.",
                    variant: v ? "warning" : "success",
                    sticky: true,
                  });
                }}
                aria-label="Simulate offline"
              />
            </div>
            <div className="rounded-lg bg-canvas p-2 text-[11px] leading-relaxed text-muted">
              Realtime tick: every ~8 seconds a farmer commits to a visible pool. Watch pool progress update.
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetMockState();
                  qc.invalidateQueries();
                  pushToast({ title: "Demo data reset", variant: "info" });
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearDrafts();
                  setProfile(null);
                  qc.clear();
                  window.location.href = "/login";
                }}
              >
                Clear session and drafts
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
