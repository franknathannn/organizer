import { createClient } from "@/lib/supabase/server";
import { GoalsClient } from "@/components/goals/GoalsClient";

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  return <GoalsClient initialGoals={goals ?? []} />;
}
