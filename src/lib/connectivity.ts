import { useEffect, useState } from "react";
import { getMockConfig } from "@/mocks/store";

export const CONNECTIVITY_EVENT = "greenroots-connectivity";

export function notifyConnectivityChange() {
  window.dispatchEvent(new Event(CONNECTIVITY_EVENT));
}

export function isOnline() {
  return navigator.onLine && !getMockConfig().offline;
}

export function useConnectivity() {
  const [online, setOnline] = useState(isOnline);
  useEffect(() => {
    const update = () => setOnline(isOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener(CONNECTIVITY_EVENT, update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener(CONNECTIVITY_EVENT, update);
    };
  }, []);
  return online;
}
