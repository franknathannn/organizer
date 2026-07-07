"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "transactions" | "todos" | "deadlines" | "goals" | "planner_events";

type RealtimeHandler<T> = {
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (old: { id: string }) => void;
};

/**
 * Subscribe to Supabase Realtime changes for a specific table,
 * filtered by user_id to prevent unnecessary re-renders.
 */
export function useRealtimeTable<T extends { id: string }>(
  table: TableName,
  userId: string | null,
  handlers: RealtimeHandler<T>
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`realtime_${table}_${userId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table,
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.new && "id" in payload.new) {
            handlersRef.current.onInsert?.(payload.new as T);
          }
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table,
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.new && "id" in payload.new) {
            handlersRef.current.onUpdate?.(payload.new as T);
          }
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "DELETE",
          schema: "public",
          table,
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.old && "id" in payload.old) {
            handlersRef.current.onDelete?.(payload.old as { id: string });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, userId]);
}
