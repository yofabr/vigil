import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

export function useRouteSync() {
  const location = useLocation();

  useEffect(() => {
    if (window.__TAURI__) {
      invoke("sync_route", { path: location.pathname }).catch(() => {});
    }
    window.history.replaceState(null, "", location.pathname);
  }, [location]);
}

declare global {
  interface Window {
    __TAURI__?: {
      invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    };
  }
}
