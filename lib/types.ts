export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  label: string;
  category: string;
  occurred_on: string; // date
  planner_event_id: string | null;
  created_at: string;
};

export type TodoUrgency = "urgent" | "will_become_urgent" | "not_urgent" | "not_important_not_urgent" | "accomplished";

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  urgency: TodoUrgency;
  due_date: string | null;
  is_done: boolean;
  done_at: string | null;
  created_at: string;
};

export type PlannerEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  planned_spend: number;
  transaction_id: string | null;
  created_at: string;
};

export type Deadline = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string;
  completed_at: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  target_count: number;
  current_count: number;
  created_at: string;
};

export const URGENCY_LABEL: Record<TodoUrgency, string> = {
  urgent: "Urgent & Important (Q1)",
  will_become_urgent: "Important & Not Urgent (Q2)",
  not_urgent: "Urgent & Not Important (Q3)",
  not_important_not_urgent: "Not Urgent & Not Important (Q4)",
  accomplished: "Accomplished",
};

export const URGENCY_ORDER: TodoUrgency[] = [
  "urgent",
  "will_become_urgent",
  "not_urgent",
  "not_important_not_urgent",
  "accomplished",
];
