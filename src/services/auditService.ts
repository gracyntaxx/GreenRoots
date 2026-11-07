import type { AiActionAudit } from "@/types";
import { call } from "./http";
import { getState } from "@/mocks/store";

export const auditService = {
  list(): Promise<AiActionAudit[]> {
    return call("audit/list", undefined, () => getState().audit);
  },
};
