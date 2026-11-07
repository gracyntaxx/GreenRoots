import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Sparkles, Users, Wheat } from "lucide-react";
import { useSession } from "@/store/session";
import { requirementService } from "@/services/requirementService";
import { aiAssistantService } from "@/services/aiAssistantService";
import { PortalPageHeader } from "@/components/shared/PageHeader";
import { ReputationBadge } from "@/components/shared/ReputationBadge";
import { AiChip } from "@/components/shared/Marks";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";

type SortKey = "score" | "distance" | "quantity";

export default function MatchesPage() {
  const profile = useSession((s) => s.profile)!;
  const [poolId, setPoolId] = useState("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [explainFor, setExplainFor] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const matches = useQuery({
    queryKey: ["matches", profile.id],
    queryFn: async () => requirementService.matchesForIndustry(profile),
  });

  const pools = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of matches.data ?? []) seen.set(m.poolId, m.poolLabel);
    return [...seen.entries()];
  }, [matches.data]);

  const rows = useMemo(() => {
    const list = (matches.data ?? []).filter((m) => poolId === "all" || m.poolId === poolId);
    return list.sort((a, b) => {
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "quantity") return b.availableKg - a.availableKg;
      return b.score - a.score;
    });
  }, [matches.data, poolId, sort]);

  const explain = async (m: NonNullable<typeof matches.data>[number]) => {
    setExplainFor(m.id);
    setExplanation(null);
    setExplaining(true);
    try {
      const text = await aiAssistantService.explainMatch(m.farmer.name, m.distanceKm, m.pastDeals);
      setExplanation(text);
    } finally {
      setExplaining(false);
    }
  };

  const active = rows.find((m) => m.id === explainFor);

  return (
    <div>
      <PortalPageHeader
        title="Farmer matches"
        description="Ranked on recorded distance, quantity fit and trust. AI explains a rank; you decide whether to invite."
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
            className="min-h-10 w-auto rounded-portal py-0 text-[13px]"
            aria-label="Filter by pool"
          >
            <option value="all">All pools</option>
            {pools.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-10 w-auto rounded-portal py-0 text-[13px]"
            aria-label="Sort matches"
          >
            <option value="score">Best match</option>
            <option value="distance">Nearest</option>
            <option value="quantity">Largest available</option>
          </Select>
        </div>
        <span className="flex items-center gap-1 text-[12px] text-muted dark:text-portal-muted">
          <Users className="h-3.5 w-3.5" /> {rows.length} candidates
        </span>
      </div>

      {matches.isLoading && <Skeleton className="h-64 w-full" />}

      {!matches.isLoading && rows.length === 0 && (
        <EmptyState
          icon={<Wheat className="h-7 w-7" />}
          title="No matches yet"
          body="Matches appear when you have an open pool. Publish a requirement first."
          action={
            <Link
              to="/portal/requirements/new"
              className="inline-flex h-10 items-center rounded-portal bg-forest px-4 text-sm font-semibold text-white"
            >
              New requirement
            </Link>
          }
        />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((m) => (
          <PortalCard key={m.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-meadow text-[13px] font-bold text-forest dark:bg-[#123524] dark:text-growth">
                  {m.farmer.avatarInitials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{m.farmer.name}</p>
                  <p className="truncate text-[11px] text-muted dark:text-portal-muted">
                    {m.farmer.village}, {m.farmer.district} · {m.farmer.state}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ReputationBadge score={m.farmer.reputation} factors={m.farmer.reputationFactors} size="sm" />
                    <span className="flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
                      <MapPin className="h-3 w-3" /> {m.distanceKm.toFixed(0)} km from pool
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Match</p>
                <p className="num text-xl font-bold text-forest dark:text-growth">{m.score}</p>
                <p className="text-[10px] text-muted dark:text-portal-muted">out of 100</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-canvas p-2 dark:bg-portal-bg">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-portal-muted">Available</p>
                <p className="num text-[12px] font-bold">{formatNumber(m.availableKg)} kg</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-portal-muted">Qty fit</p>
                <p className="num text-[12px] font-bold">{m.quantityFit}%</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-portal-muted">Past deals</p>
                <p className="num text-[12px] font-bold">{m.pastDeals}</p>
              </div>
            </div>

            <p className="mt-2 truncate text-[11px] text-muted dark:text-portal-muted">Pool: {m.poolLabel}</p>

            <div className="mt-3 flex items-center gap-2">
              <Button variant="ai" size="portal" className="flex-1" onClick={() => explain(m)}>
                <Sparkles className="h-4 w-4" /> Why this rank
              </Button>
              <Link
                to={`/portal/pools/${m.poolId}`}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-portal border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink dark:hover:bg-portal-bg"
              >
                View pool
              </Link>
            </div>
          </PortalCard>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
        <Sparkles className="h-3 w-3 text-ai" /> Ranking uses recorded data only. AI never contacts a farmer on your
        behalf.
      </p>

      <Dialog open={!!explainFor} onOpenChange={(v) => !v && setExplainFor(null)}>
        <DialogContent variant="center" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ai" /> Why this farmer is ranked here
            </DialogTitle>
            <DialogDescription>{active?.farmer.name} · {active?.poolLabel}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-[#D9D2F7] bg-aitint p-3 text-[13px] leading-relaxed text-[#4b3f97]">
            {explaining ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing an explanation…
              </span>
            ) : (
              explanation
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-canvas p-2 dark:bg-portal-bg">
              <p className="text-[10px] font-semibold uppercase text-muted dark:text-portal-muted">Quantity fit</p>
              <p className="num text-sm font-bold">{active?.quantityFit}%</p>
            </div>
            <div className="rounded-lg bg-canvas p-2 dark:bg-portal-bg">
              <p className="text-[10px] font-semibold uppercase text-muted dark:text-portal-muted">Trust</p>
              <p className="num text-sm font-bold">{active?.trust}%</p>
            </div>
            <div className="rounded-lg bg-canvas p-2 dark:bg-portal-bg">
              <p className="text-[10px] font-semibold uppercase text-muted dark:text-portal-muted">Distance</p>
              <p className="num text-sm font-bold">{active?.distanceKm.toFixed(0)} km</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted dark:text-portal-muted">
            This explanation is generated from recorded profile and pool data. It is not a guarantee of supply.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="portal" className="flex-1" onClick={() => setExplainFor(null)}>
              Close
            </Button>
            {active && (
              <Link
                to={`/portal/pools/${active.poolId}`}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-portal bg-forest px-3 text-sm font-semibold text-white"
              >
                View pool
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
