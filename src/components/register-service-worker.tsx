"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability degrades gracefully without a service worker — the
        // app itself never depends on it, so a failed registration is safe
        // to ignore.
      });
    }
  }, []);

  return null;
}
