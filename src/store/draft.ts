import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ListingDraft, RequirementDraft } from "@/types";

interface DraftState {
  voiceText: string;
  listingDraft: ListingDraft | null;
  requirementText: string;
  requirementDraft: RequirementDraft | null;
  setVoiceText: (text: string) => void;
  setListingDraft: (draft: ListingDraft | null) => void;
  setRequirementText: (text: string) => void;
  setRequirementDraft: (draft: RequirementDraft | null) => void;
  clearDrafts: () => void;
}

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      voiceText: "",
      listingDraft: null,
      requirementText: "",
      requirementDraft: null,
      setVoiceText: (voiceText) => set({ voiceText }),
      setListingDraft: (listingDraft) => set({ listingDraft }),
      setRequirementText: (requirementText) => set({ requirementText }),
      setRequirementDraft: (requirementDraft) => set({ requirementDraft }),
      clearDrafts: () =>
        set({ voiceText: "", listingDraft: null, requirementText: "", requirementDraft: null }),
    }),
    { name: "greenroots-drafts" }
  )
);
