import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeStore } from "@/mocks/store";
import { useUi } from "@/store/ui";

export function RealtimeBridge() {
  const qc = useQueryClient();
  const pushToast = useUi((s) => s.pushToast);

  useEffect(() => {
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
  }, [qc, pushToast]);

  return null;
}
