import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { notificationService } from "@/services/notificationService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, timeAgo } from "@/lib/utils";

export function resolveFieldLink(link: string) {
  if (link.startsWith("/pools") || link.startsWith("/orders")) return `/app${link}`;
  if (link.startsWith("/forecast")) return "/app/home";
  return "/app/home";
}

export function NotificationBell({ mode = "field" }: { mode?: "field" | "portal" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["notifications"], queryFn: notificationService.list });
  const unread = data.filter((n) => !n.read).length;

  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink dark:hover:bg-portal-bg"
          )}
          aria-label={`${t("common.notifications")}${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-portal-line">
          <p className="text-sm font-bold">{t("common.notifications")}</p>
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest hover:underline dark:text-growth"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("notifications.markAllRead")}
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.slice(0, 5).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                markOne.mutate(n.id);
                if (mode === "field") navigate(resolveFieldLink(n.link));
              }}
              className={cn(
                "flex w-full items-start gap-2 border-b border-line/60 px-4 py-3 text-left hover:bg-canvas dark:border-portal-line/60 dark:hover:bg-portal-bg",
                !n.read && "bg-meadow/40 dark:bg-portal-bg/60"
              )}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-line" : "bg-forest")} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink dark:text-portal-ink">{n.title}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted dark:text-portal-muted">{n.body}</span>
                <span className="mt-1 block text-[11px] text-muted dark:text-portal-muted">{timeAgo(n.at)}</span>
              </span>
            </button>
          ))}
          {data.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted">{t("notifications.empty")}</p>
          )}
        </div>
        {mode === "field" && (
          <button
            type="button"
            onClick={() => navigate("/app/notifications")}
            className="w-full px-4 py-3 text-center text-[13px] font-semibold text-forest hover:bg-canvas dark:text-growth dark:hover:bg-portal-bg"
          >
            {t("common.viewAll")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
