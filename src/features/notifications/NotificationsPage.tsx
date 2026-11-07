import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { resolveFieldLink } from "@/components/shared/NotificationBell";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
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
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink">{t("notifications.title")}</h1>
          <p className="text-[12px] text-muted">{unread ? `${unread} unread` : "All caught up"}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <CheckCheck className="h-4 w-4" /> {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-2 pb-4">
        {notifications.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}

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
              "flex w-full items-start gap-3 rounded-xl border-[1.5px] p-3 text-left transition-colors",
              n.read ? "border-line bg-surface" : "border-forest/30 bg-meadow/40"
            )}
          >
            <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", n.read ? "bg-line" : "bg-forest")} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", groupTone[n.group] ?? "bg-canvas text-muted")}>
                  {n.group}
                </span>
                {!n.read && <span className="text-[10px] font-bold text-forest">NEW</span>}
              </span>
              <span className="mt-1 block text-[13px] font-semibold leading-snug text-ink">{n.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">{n.body}</span>
              <span className="mt-1 block text-[11px] text-muted">{timeAgo(n.at)}</span>
            </span>
          </button>
        ))}

        <p className="pt-1 text-center text-[11px] leading-relaxed text-muted">{t("notifications.channelsNote")}</p>
      </div>
    </div>
  );
}
