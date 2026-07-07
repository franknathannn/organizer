import { createClient } from "@/lib/supabase/server";
import { PlannerClient } from "@/components/planner/PlannerClient";

export default async function PlannerPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("planner_events")
    .select("*")
    .order("event_date", { ascending: true });

  return <PlannerClient initialEvents={events ?? []} />;
}
