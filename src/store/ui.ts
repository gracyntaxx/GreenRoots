import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/types";
import i18n from "@/i18n";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  sticky?: boolean;
}

interface UiState {
  language: Language;
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  devPanelOpen: boolean;
  toasts: Toast[];
  setLanguage: (l: Language) => void;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setDevPanelOpen: (open: boolean) => void;
  pushToast: (t: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
}

function applyLanguage(l: Language) {
  i18n.changeLanguage(l);
  document.documentElement.lang = l;
  document.body.classList.toggle("lang-indic", l !== "en");
}

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      language: "en",
      theme: "light",
      sidebarCollapsed: false,
      devPanelOpen: false,
      toasts: [],
      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setDevPanelOpen: (devPanelOpen) => set({ devPanelOpen }),
      pushToast: (t) => {
        const id = `toast_${Math.random().toString(36).slice(2, 9)}`;
        set({ toasts: [...get().toasts, { ...t, id }] });
        if (!t.sticky) {
          setTimeout(() => {
            set({ toasts: get().toasts.filter((x) => x.id !== id) });
          }, 5000);
        }
        return id;
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
    }),
    {
      name: "greenroots-ui",
      partialize: (s) => ({ language: s.language, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.language);
      },
    }
  )
);
