import { createContext, useContext } from "react";

export interface FieldShellApi {
  openVoice: () => void;
  openOnboarding: () => void;
}

export const FieldShellContext = createContext<FieldShellApi>({
  openVoice: () => undefined,
  openOnboarding: () => undefined,
});

export function useFieldShell() {
  return useContext(FieldShellContext);
}
