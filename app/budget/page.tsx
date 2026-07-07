import { createClient } from "@/lib/supabase/server";
import { BudgetClient } from "@/components/budget/BudgetClient";

export default async function BudgetPage() {
  const supabase = createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  return <BudgetClient initialTransactions={transactions ?? []} />;
}
