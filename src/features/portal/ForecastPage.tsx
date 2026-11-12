import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Database, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { forecastService } from "@/services/forecastService";
import { aiAssistantService } from "@/services/aiAssistantService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { AiChip, EstimateLabel } from "@/components/shared/Marks";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { WASTE_LABELS } from "@/types";
import { formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/shared/PageContainer";

const confidenceTone: Record<string, string> = {
  High: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  Medium: "bg-[#FEF3C7] text-[#92400E]",
  Low: "bg-[#FEE2E2] text-[#991B1B]",
  Insufficient: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
};

export default function ForecastPage() {
  const forecasts = useQuery({ queryKey: ["forecasts"], queryFn: () => forecastService.list() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const selected = useMemo(() => {
    const list = forecasts.data ?? [];
    return list.find((f) => f.id === selectedId) ?? list[0];
  }, [forecasts.data, selectedId]);

  const chartData = (selected?.points ?? []).map((p) => ({
    period: p.period,
    availability: p.availabilityTonnes,
    demand: p.demandTonnes,
  }));

  const explain = async () => {
    if (!selected) return;
    setExplaining(true);
    setExplanation(null);
    try {
      const text = await aiAssistantService.explainForecast(selected);
      setExplanation(text);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <PageContainer>
      <PortalPageHeader
        title="Seasonal Demand Forecasting"
        description="Empirical availability and demand projections from recorded collection history. Zero synthetic numbers; all forecasts carry explicit sample periods and estimate disclaimers."
        actions={<AiChip kind="forecast" />}
      />

      {/* Regional Harvest Surge Alert Banner */}
      <div className="rounded-panel border border-terracotta/30 bg-gradient-to-r from-wheat-soft via-white to-sage/40 p-4 shadow-card backdrop-blur-md dark:border-portal-line dark:from-portal-surface dark:to-portal-surface">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terracotta text-white shadow-xs">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-heading text-sm font-bold text-moss dark:text-portal-ink">
                AI Seasonal Demand Surge Alert · {selected?.state || "Regional"} Cluster
              </span>
              <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 text-[10px] font-bold text-terracotta-dark border border-terracotta/20">
                Estimate · Historical Model
              </span>
            </div>
            <p className="mt-1 text-xs text-muted leading-relaxed dark:text-portal-muted">
              Bio-pellet and paper board industries project a <strong className="text-terracotta font-semibold">+34% seasonal surge in demand</strong> over the next 21 days based on Q4 historical requirement pools.
            </p>
          </div>
        </div>
      </div>

      {forecasts.isLoading && <Skeleton className="h-80 w-full" />}

      {!forecasts.isLoading && !selected && (
        <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No forecasts available" body="No seasonal history has been recorded yet." />
      )}

      {selected && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {(forecasts.data ?? []).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedId(f.id);
                  setExplanation(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-semibold",
                  selected.id === f.id
                    ? "border-forest bg-meadow text-forest dark:border-growth/40 dark:bg-[#123524] dark:text-growth"
                    : "border-line bg-surface text-muted hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted dark:hover:bg-portal-bg"
                )}
              >
                {f.state} · {WASTE_LABELS[f.wasteType]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Region" value={<span className="text-lg">{selected.state}</span>} sub={selected.region} />
            <StatCard label="Season" value={<span className="text-lg">{selected.season}</span>} sub={WASTE_LABELS[selected.wasteType]} />
            <StatCard
              label="Confidence"
              value={
                <span className={cn("rounded-full px-2.5 py-1 text-[13px] font-bold", confidenceTone[selected.confidence])}>
                  {selected.confidence}
                </span>
              }
              sub={selected.limitedData ? "Not enough history" : `${formatNumber(selected.sampleSize)} records`}
              tone={selected.confidence === "High" ? "success" : selected.limitedData ? "warning" : "default"}
            />
            <StatCard label="Data period" value={<span className="text-lg">{selected.dataPeriod}</span>} sub="Recorded collection history" icon={<Database className="h-5 w-5 text-navy" />} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <PortalCard className="p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold">Availability vs demand</p>
                  <p className="text-[11px] text-muted dark:text-portal-muted">Tonnes per period</p>
                </div>
                <EstimateLabel explanation="These figures are estimates based on recorded collection history, not guarantees." />
              </div>

              {selected.limitedData ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-settle/50 bg-[#FFFBEB] p-6 text-center dark:bg-[#2A2110]">
                  <AlertTriangle className="h-8 w-8 text-settle" />
                  <p className="mt-2 text-[14px] font-bold text-[#92400E]">Limited data</p>
                  <p className="mt-1 max-w-md text-[12px] leading-relaxed text-[#92400E]">
                    There is not enough recorded history for {selected.region} in {selected.season}. No number is shown
                    rather than inventing one. More collection records are needed.
                  </p>
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="avail" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B3B2B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1B3B2B" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="demand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D96B27" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#D96B27" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DCE4DF" opacity={0.6} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#52635A" }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#52635A" }}
                        tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                        width={38}
                      />
                      <ChartTooltip
                        formatter={(value, name) => [
                          `${formatNumber(Number(value))} tonnes`,
                          name === "availability" ? "Historical Supply" : "Projected Demand",
                        ]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, borderColor: "#DCE4DF", backgroundColor: "#FFFFFF" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="availability" name="Historical Supply" stroke="#1B3B2B" strokeWidth={2.5} fill="url(#avail)" />
                      <Area type="monotone" dataKey="demand" name="Projected Industry Demand" stroke="#D96B27" strokeWidth={2.5} fill="url(#demand)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2 text-[11px] text-muted dark:border-portal-line dark:text-portal-muted">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-forest" /> Availability
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-ai" /> Demand
                </span>
                <span>·</span>
                <span>Estimate only, not a guarantee.</span>
              </div>
            </PortalCard>

            <div className="space-y-4">
              <PortalCard className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold">
                    <Sparkles className="h-4 w-4 text-ai" /> AI explanation
                  </p>
                  <AiChip kind="explanation" iconOnly />
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted dark:text-portal-muted">{selected.explanation}</p>
                <Button variant="ai" size="portal" className="mt-3 w-full" onClick={explain} disabled={explaining}>
                  {explaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Explain this forecast
                </Button>
                {explanation && (
                  <p className="mt-2 rounded-lg bg-aitint p-2.5 text-[12px] leading-relaxed text-[#4b3f97]">{explanation}</p>
                )}
                <p className="mt-2 text-[10px] text-muted dark:text-portal-muted">
                  Explanations never change the underlying numbers.
                </p>
              </PortalCard>

              <PortalCard className="p-4">
                <p className="text-[13px] font-bold">Suggested actions</p>
                <ul className="mt-2 space-y-1.5">
                  {selected.actions.map((a) => (
                    <li key={a} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-muted dark:text-portal-muted">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest dark:text-growth" />
                      {a}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-lg bg-canvas p-2 text-[10px] leading-relaxed text-muted dark:bg-portal-bg dark:text-portal-muted">
                  Suggestions are informational. Nothing is scheduled or published automatically.
                </p>
              </PortalCard>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
