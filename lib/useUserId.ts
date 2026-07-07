"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Returns the current Supabase user ID (or null while loading). */
export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  return userId;
}
