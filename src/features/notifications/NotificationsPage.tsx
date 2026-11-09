import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { resolveFieldLink } from "@/components/shared/NotificationBell";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
import { cn, timeAgo } from "@/lib/utils";

const groupTone: Record<string, string> = {
  Requirement: "bg-navy/10 text-navy",
  Pool: "bg-meadow text-forest",
  Area: "bg-settle/15 text-[#92400E]",
  Order: "bg-escrow/10 text-escrow",
  Payment: "bg-meadow text-forest",
  Seasonal: "bg-settle/15 text-[#92400E]",
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: notificationService.list });

  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const rows = notifications.data ?? [];
  const unread = rows.filter((n) => !n.read).length;

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4 dark:border-portal-line">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{t("notifications.title")}</h1>
            <p className="mt-1 text-sm text-muted dark:text-portal-muted">{unread ? `${unread} unread notifications` : "All caught up"}</p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="portal" onClick={() => markAll.mutate()}>
              <CheckCheck className="h-4 w-4" /> {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-3 pb-6">
          {notifications.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

          {!notifications.isLoading && rows.length === 0 && (
            <EmptyState icon={<Bell className="h-7 w-7" />} title={t("notifications.empty")} body={t("notifications.emptyBody")} />
          )}

          {rows.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.read) markOne.mutate(n.id);
                navigate(resolveFieldLink(n.link));
              }}
              className={cn(
                "flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors shadow-sm",
                n.read
                  ? "border-line bg-surface hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:hover:bg-portal-bg"
                  : "border-forest/40 bg-meadow/40 dark:border-forest/30 dark:bg-[#0F2A1B]"
              )}
            >
              <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", n.read ? "bg-line dark:bg-portal-line" : "bg-forest dark:bg-growth")} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", groupTone[n.group] ?? "bg-canvas text-muted")}>
                    {n.group}
                  </span>
                  {!n.read && <span className="rounded bg-forest px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                </span>
                <span className="mt-1.5 block text-sm sm:text-base font-bold leading-snug text-ink dark:text-portal-ink">{n.title}</span>
                <span className="mt-1 block text-xs sm:text-sm leading-relaxed text-muted dark:text-portal-muted">{n.body}</span>
                <span className="mt-1.5 block text-xs text-muted dark:text-portal-muted">{timeAgo(n.at)}</span>
              </span>
            </button>
          ))}

          <p className="pt-2 text-center text-xs leading-relaxed text-muted dark:text-portal-muted">{t("notifications.channelsNote")}</p>
        </div>
      </div>
    </PageContainer>
  );
}
