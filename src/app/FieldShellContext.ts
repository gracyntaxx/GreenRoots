import { createContext, useContext } from "react";

export interface AppShellApi {
  openVoice: () => void;
  openOnboarding: () => void;
}

export const AppShellContext = createContext<AppShellApi>({
  openVoice: () => undefined,
  openOnboarding: () => undefined,
});

export function useAppShell() {
  return useContext(AppShellContext);
}

// Backward-compatible alias for existing imports
export const FieldShellContext = AppShellContext;
export const useFieldShell = useAppShell;
export type FieldShellApi = AppShellApi;
