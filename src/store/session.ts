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
      setProfile: (profile) => {
        if (!profile || typeof profile !== "object" || !("role" in profile) || !profile.role || "error" in profile) {
          set({ profile: null });
        } else {
          set({ profile });
        }
      },
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
        profile: s.profile && s.profile.role && !("error" in s.profile) ? s.profile : null,
        onboardingSeen: s.onboardingSeen,
        selectedCollectionPointId: s.selectedCollectionPointId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.profile && (!state.profile.role || "error" in state.profile)) {
          state.profile = null;
        }
      },
    }
  )
);
