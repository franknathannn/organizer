"use client";

import { useEffect } from "react";

const KEEPALIVE_KEY = "supabase_last_keepalive";
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function SupabaseKeepalive() {
  useEffect(() => {
    function shouldPing() {
      const last = localStorage.getItem(KEEPALIVE_KEY);
      if (!last) return true;
      return Date.now() - parseInt(last, 10) >= ONE_DAY_MS;
    }

    async function ping() {
      if (!shouldPing()) return;
      try {
        const res = await fetch("/api/keepalive");
        if (res.ok) {
          localStorage.setItem(KEEPALIVE_KEY, String(Date.now()));
        }
      } catch {
        // Silently fail — will retry on next page load
      }
    }

    ping();
  }, []);

  return null;
}
