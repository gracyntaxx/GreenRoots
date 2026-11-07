import type { ModerationFlag } from "@/types";
import { call } from "./http";
import { decideFlag, getState } from "@/mocks/store";

export const moderationService = {
  list(): Promise<ModerationFlag[]> {
    return call("moderation/list", undefined, () => getState().flags);
  },

  decide(id: string, decision: ModerationFlag["status"], reason: string): Promise<ModerationFlag> {
    return call(
      "moderation/decide",
      { method: "POST", body: JSON.stringify({ id, decision, reason }) },
      () => decideFlag(id, decision, reason),
      { mutation: true }
    );
  },
};
