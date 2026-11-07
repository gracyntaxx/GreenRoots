import type { CollectionPoint, IndustryVerification, Profile } from "@/types";
import { call } from "./http";
import { decideVerification, getState, MockError } from "@/mocks/store";
import { uid } from "@/lib/utils";
import { collectionService } from "./collectionService";

export const adminService = {
  verifications(): Promise<IndustryVerification[]> {
    return call("admin/verifications", undefined, () => getState().verifications);
  },

  decideVerification(
    id: string,
    decision: "Verified" | "Rejected",
    reason?: string
  ): Promise<IndustryVerification> {
    return call(
      "admin/verify-industry",
      { method: "POST", body: JSON.stringify({ id, decision, reason }) },
      () => {
        if (decision === "Rejected" && !reason?.trim()) {
          throw new MockError("A rejection reason is required.", "VALIDATION");
        }
        return decideVerification(id, decision, reason);
      },
      { mutation: true }
    );
  },

  users(): Promise<Profile[]> {
    return call("admin/users", undefined, () => getState().profiles);
  },

  listings() {
    return call("admin/listings", undefined, () => getState().listings);
  },

  requirements() {
    return call("admin/requirements", undefined, () => getState().requirements);
  },

  removeListing(id: string, reason: string) {
    return call("admin/remove-listing", { method: "POST", body: JSON.stringify({ id, reason }) }, () => {
      if (!reason.trim()) throw new MockError("A reason is required.", "VALIDATION");
      const state = getState();
      const listing = state.listings.find((l) => l.id === id);
      state.listings = state.listings.filter((l) => l.id !== id);
      state.audit.unshift({
        id: uid("aud"),
        at: new Date().toISOString(),
        actor: "Priya Menon",
        actorRole: "admin",
        aiPreparedSummary: `Remove listing ${listing?.wasteType ?? id}`,
        confirmedBy: "Priya Menon",
        action: "Listing removed",
        reference: id,
        outcome: reason,
      });
      return { ok: true };
    }, { mutation: true });
  },

  removeRequirement(id: string, reason: string) {
    return call("admin/remove-requirement", { method: "POST", body: JSON.stringify({ id, reason }) }, () => {
      if (!reason.trim()) throw new MockError("A reason is required.", "VALIDATION");
      const state = getState();
      state.requirements = state.requirements.filter((r) => r.id !== id);
      state.audit.unshift({
        id: uid("aud"),
        at: new Date().toISOString(),
        actor: "Priya Menon",
        actorRole: "admin",
        aiPreparedSummary: `Remove requirement ${id}`,
        confirmedBy: "Priya Menon",
        action: "Requirement removed",
        reference: id,
        outcome: reason,
      });
      return { ok: true };
    }, { mutation: true });
  },

  collectionPoints() {
    return call("admin/collection-points", undefined, () => getState().collectionPoints);
  },

  saveCollectionPoint(point: Partial<CollectionPoint> & { id?: string }) {
    return collectionService.save(point);
  },

  payables() {
    return call("admin/payables", undefined, () => getState().payables);
  },
};
