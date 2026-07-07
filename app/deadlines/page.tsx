import { createClient } from "@/lib/supabase/server";
import { DeadlinesClient } from "@/components/deadlines/DeadlinesClient";

export default async function DeadlinesPage() {
  const supabase = createClient();
  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .order("due_date", { ascending: true });

  return <DeadlinesClient initialDeadlines={deadlines ?? []} />;
}
