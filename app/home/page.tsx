import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: transactions }, { data: todos }, { data: deadlines }, { data: goals }, { data: events }] =
    await Promise.all([
      supabase.from("transactions").select("*"),
      supabase.from("todos").select("*"),
      supabase.from("deadlines").select("*").order("due_date", { ascending: true }),
      supabase.from("goals").select("*"),
      supabase
        .from("planner_events")
        .select("*")
        .order("event_date", { ascending: true }),
    ]);

  return (
    <DashboardClient
      transactions={transactions ?? []}
      todos={todos ?? []}
      deadlines={deadlines ?? []}
      goals={goals ?? []}
      events={events ?? []}
    />
  );
}
