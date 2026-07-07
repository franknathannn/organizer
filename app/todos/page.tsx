import { createClient } from "@/lib/supabase/server";
import { TodosClient } from "@/components/todos/TodosClient";

export default async function TodosPage() {
  const supabase = createClient();
  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  return <TodosClient initialTodos={todos ?? []} />;
}
