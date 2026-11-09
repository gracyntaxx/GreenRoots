import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeStore } from "@/mocks/store";
import { useUi } from "@/store/ui";
import { USE_MOCKS } from "@/services/http";
import { supabase } from "@/lib/supabaseClient";

export function RealtimeBridge() {
  const qc = useQueryClient();
  const pushToast = useUi((s) => s.pushToast);

  useEffect(() => {
    if (USE_MOCKS) {
      const unsubscribe = subscribeStore((event) => {
        if (event.type === "pool-updated") {
          qc.invalidateQueries({ queryKey: ["pools"] });
          qc.invalidateQueries({ queryKey: ["pool", event.poolId] });
          qc.invalidateQueries({ queryKey: ["contributions", event.poolId] });
          qc.invalidateQueries({ queryKey: ["requirements"] });
        }
        if (event.type === "notification") {
          qc.invalidateQueries({ queryKey: ["notifications"] });
        }
        if (event.type === "reset") {
          qc.invalidateQueries();
          pushToast({
            title: "Demo data reset",
            description: "All mock records are back to their starting values.",
            variant: "info",
          });
        }
      });
      return () => {
        unsubscribe();
      };
    }

    // Real Supabase Realtime subscriptions
    const channel = supabase
      .channel("greenroots-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pools" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["pools"] });
          if (payload.new && "id" in payload.new) {
            qc.invalidateQueries({ queryKey: ["pool", (payload.new as { id: string }).id] });
          }
          qc.invalidateQueries({ queryKey: ["requirements"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pool_contributions" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["pools"] });
          if (payload.new && "pool_id" in payload.new) {
            qc.invalidateQueries({ queryKey: ["contributions", (payload.new as { pool_id: string }).pool_id] });
            qc.invalidateQueries({ queryKey: ["pool", (payload.new as { pool_id: string }).pool_id] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["orders"] });
          if (payload.new && "id" in payload.new) {
            qc.invalidateQueries({ queryKey: ["order", (payload.new as { id: string }).id] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          qc.invalidateQueries({ queryKey: ["payments"] });
          qc.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
          const newNotif = payload.new as { title?: string; body?: string };
          if (newNotif?.title) {
            pushToast({
              title: newNotif.title,
              description: newNotif.body,
              variant: "info",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, pushToast]);

  return null;
}
