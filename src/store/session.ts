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
          // Normalize legacy Haryana coordinates to Goa
          const normalized = { ...profile };
          if (!normalized.location || normalized.location.lat > 20 || normalized.state === "Haryana" || normalized.village === "Rewari" || normalized.village === "Bawal") {
            normalized.village = normalized.village === "Bawal" ? "Vasco" : "Margao";
            normalized.district = "South Goa";
            normalized.state = "Goa";
            normalized.location = normalized.village === "Vasco" ? { lat: 15.3982, lng: 73.8113 } : { lat: 15.2736, lng: 73.9580 };
          }
          set({ profile: normalized });
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
        } else if (state?.profile) {
          // Auto-migrate any previously stored session from Haryana/Rewari to Goa
          if (
            !state.profile.location ||
            state.profile.location.lat > 20 ||
            state.profile.state === "Haryana" ||
            state.profile.village === "Rewari" ||
            state.profile.village === "Bawal" ||
            state.profile.village === "Panipat"
          ) {
            state.profile.village = "Margao";
            state.profile.district = "South Goa";
            state.profile.state = "Goa";
            state.profile.location = { lat: 15.2736, lng: 73.9580 };
          }
        }
      },
    }
  )
);
