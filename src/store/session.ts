import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface SessionState {
  profile: Profile | null;
  onboardingSeen: boolean;
  selectedCollectionPointId: string | null;
  setProfile: (profile: Profile | null) => void;
  setOnboardingSeen: (seen: boolean) => void;
  setSelectedCollectionPointId: (id: string | null) => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      profile: null,
      onboardingSeen: true,
      selectedCollectionPointId: null,
      setProfile: (profile) => set({ profile }),
      setOnboardingSeen: (onboardingSeen) => set({ onboardingSeen }),
      setSelectedCollectionPointId: (selectedCollectionPointId) => set({ selectedCollectionPointId }),
      logout: () =>
        set({
          profile: null,
          onboardingSeen: true,
          selectedCollectionPointId: null,
        }),
    }),
    {
      name: "greenroots-session",
      partialize: (s) => ({
        profile: s.profile,
        onboardingSeen: s.onboardingSeen,
        selectedCollectionPointId: s.selectedCollectionPointId,
      }),
    }
  )
);
