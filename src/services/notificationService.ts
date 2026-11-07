import type { AppNotification } from "@/types";
import { call } from "./http";
import { getState, markAllNotificationsRead, updateNotificationRead } from "@/mocks/store";

export const notificationService = {
  list(): Promise<AppNotification[]> {
    return call("notifications/list", undefined, () => getState().notifications);
  },

  markRead(id: string, read = true): Promise<AppNotification | undefined> {
    return call("notifications/read", { method: "POST", body: JSON.stringify({ id, read }) }, () =>
      updateNotificationRead(id, read)
    );
  },

  markAllRead(): Promise<AppNotification[]> {
    return call("notifications/read-all", { method: "POST" }, () => markAllNotificationsRead());
  },
};
