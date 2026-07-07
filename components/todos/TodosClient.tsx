"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Todo, TodoUrgency } from "@/lib/types";
import { URGENCY_LABEL } from "@/lib/types";
import { formatDate, todayISO, cn, daysBetween } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Plus, Trash2, Check, Edit2, RotateCcw, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { PageTransition } from "@/components/ui/PageTransition";

const QUADRANTS: { urgency: TodoUrgency; label: string; desc: string; tone: "urgent" | "soon" | "later" | "done" }[] = [
  { urgency: "urgent", label: "Do It Now", desc: "This is important AND urgent. Handle it ASAP.", tone: "urgent" },
  { urgency: "will_become_urgent", label: "Plan It", desc: "Important but not rushing. Schedule some time for it.", tone: "soon" },
  { urgency: "not_urgent", label: "Hand It Off", desc: "Urgent but not that important. Can someone else do it?", tone: "later" },
  { urgency: "not_important_not_urgent", label: "Drop It", desc: "Not urgent, not important. Maybe skip this one?", tone: "done" },
];

export function TodosClient({ initialTodos }: { initialTodos: Todo[] }) {
  const supabase = createClient();
  const [todos, setTodos] = useState(initialTodos);
  const [showAddForm, setShowAddForm] = useState<TodoUrgency | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [noSpecificDate, setNoSpecificDate] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);

  // Edit Modal State
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNoSpecificDate, setEditNoSpecificDate] = useState(false);
  const [editUrgency, setEditUrgency] = useState<TodoUrgency>("urgent");
  const [savingEdit, setSavingEdit] = useState(false);

  async function addTodo(urgency: TodoUrgency) {
    if (!title.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: user.id,
        title: title.trim(),
        urgency,
        due_date: noSpecificDate ? null : dueDate || null,
        is_done: false,
      })
      .select()
      .single();

    if (!error && data) {
      setTodos((prev) => [data as Todo, ...prev]);
      setTitle("");
      setDueDate(todayISO());
      setShowAddForm(null);
    }
  }

  async function toggleTodoDone(todo: Todo) {
    const nextDone = !todo.is_done;
    const doneAt = nextDone ? new Date().toISOString() : null;

    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              is_done: nextDone,
              done_at: doneAt,
            }
          : t
      )
    );

    await supabase
      .from("todos")
      .update({
        is_done: nextDone,
        done_at: doneAt,
      })
      .eq("id", todo.id);
  }

  async function removeTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  }

  function openEditModal(todo: Todo) {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date || todayISO());
    setEditNoSpecificDate(!todo.due_date);
    setEditUrgency(todo.urgency);
  }

  async function saveTodoEdit() {
    if (!editingTodo || !editTitle.trim()) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("todos")
      .update({
        title: editTitle.trim(),
        due_date: editNoSpecificDate ? null : editDueDate || null,
        urgency: editUrgency,
      })
      .eq("id", editingTodo.id);

    if (!error) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === editingTodo.id
              ? {
                  ...t,
                  title: editTitle.trim(),
                  due_date: editNoSpecificDate ? null : editDueDate || null,
                  urgency: editUrgency,
                }
            : t
        )
      );
      setEditingTodo(null);
    }
    setSavingEdit(false);
  }

  const columns = useMemo(() => {
    const grouped: Record<TodoUrgency, Todo[]> = {
      urgent: [],
      will_become_urgent: [],
      not_urgent: [],
      not_important_not_urgent: [],
      accomplished: [], // keep for legacy support if needed
    };
    for (const t of todos) {
      if (t.is_done && hideChecked) continue;
      // If legacy task has urgency accomplished, map it to Q4 for safety or keep
      const urgencyKey = t.urgency === "accomplished" ? "not_important_not_urgent" : t.urgency;
      grouped[urgencyKey].push(t);
    }
    return grouped;
  }, [todos, hideChecked]);

  return (
    <>
      <CoverImage src="/todolist.webp" />
      <PageTransition>
      <div className="p-4 md:p-12 space-y-8 w-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
            My Tasks
          </p>
          <h1 className="font-display text-3xl text-ink">What should I work on?</h1>
        </div>
        <button
          onClick={() => setHideChecked((v) => !v)}
          className={cn(
            "font-mono text-xs uppercase tracking-wide rounded-full border px-3 py-1.5 transition-colors self-start sm:self-auto",
            hideChecked
              ? "border-amber/50 bg-amber/10 text-amber"
              : "border-border text-muted hover:text-ink"
          )}
        >
          {hideChecked ? "Done tasks hidden" : "All tasks shown"}
        </button>
      </header>

      {/* Eisenhower Matrix 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {QUADRANTS.map(({ urgency, label, desc, tone }) => (
          <Panel key={urgency} className="flex flex-col border border-border/80">
            <div className="px-4 pt-4 pb-2 border-b border-border/40 flex items-center justify-between bg-panel-raised/40">
              <div>
                <Badge tone={tone}>{label}</Badge>
                <p className="text-[11px] text-muted font-mono mt-1">{desc}</p>
              </div>
              <span className="font-mono text-xs text-muted bg-base/50 px-2 py-0.5 rounded border border-border">
                {columns[urgency]?.length || 0}
              </span>
            </div>

            <div className="p-3 space-y-3 min-h-[180px] max-h-[400px] overflow-y-auto divide-y divide-border/20">
              {(!columns[urgency] || columns[urgency].length === 0) && (
                <div className="h-28 flex items-center justify-center text-xs text-muted font-mono">
                  No tasks here
                </div>
              )}
              {columns[urgency]?.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "group flex flex-col justify-between p-3 rounded-lg hover:bg-panel-raised/30 transition-colors border border-transparent hover:border-border/30",
                    todo.is_done && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTodoDone(todo)}
                      className={cn(
                        "mt-1 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors",
                        todo.is_done
                          ? "border-done bg-done text-base"
                          : "border-border-bright hover:border-done"
                      )}
                    >
                      {todo.is_done && <Check size={12} className="stroke-[3] text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm text-ink font-medium break-words",
                          todo.is_done && "line-through text-muted"
                        )}
                      >
                        {todo.title}
                      </p>
                      {todo.is_done && todo.done_at ? (
                        <p className="font-mono text-[10px] text-muted mt-1">
                          Completed {formatDate(todo.done_at.slice(0, 10))}
                        </p>
                      ) : todo.due_date ? (
                        <p className="font-mono text-[10px] mt-1">
                          {(() => {
                            const daysLeft = daysBetween(todo.due_date, todayISO());
                            let toneColor = "text-danger";
                            if (daysLeft > 5) toneColor = "text-teal";
                            else if (daysLeft >= 2) toneColor = "text-amber";
                            
                            return (
                              <>
                                <span className={cn("uppercase tracking-wider font-semibold", toneColor)}>
                                  {daysLeft < 0
                                    ? `${Math.abs(daysLeft)} DAYS OVERDUE`
                                    : daysLeft === 0
                                    ? "DUE TODAY"
                                    : `${daysLeft} DAYS LEFT`}
                                </span>
                                <span className="text-muted ml-1.5">
                                  · {formatDate(todo.due_date)}
                                </span>
                              </>
                            );
                          })()}
                        </p>
                      ) : (
                        <p className="font-mono text-[10px] text-muted mt-1">No due date</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(todo)}
                      className="text-muted hover:text-amber p-1 hover:bg-panel-raised rounded transition-colors"
                      title="Edit task"
                    >
                      <Edit2 size={13} />
                    </button>
                    {todo.is_done && (
                      <button
                        onClick={() => toggleTodoDone(todo)}
                        className="text-muted hover:text-teal p-1 hover:bg-panel-raised rounded transition-colors"
                        title="Re-do / Re-open"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => removeTodo(todo.id)}
                      className="text-muted hover:text-danger p-1 hover:bg-panel-raised rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddForm === urgency ? (
              <div className="p-3 bg-panel-raised/30 border-t border-border/40 space-y-3">
                <Input
                  autoFocus
                  placeholder="What do you need to do?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo(urgency)}
                />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-muted">When?</label>
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={noSpecificDate} 
                        onChange={(e) => setNoSpecificDate(e.target.checked)} 
                        className="accent-amber"
                      />
                      No specific date
                    </label>
                  </div>
                  {!noSpecificDate && <DatePicker value={dueDate} onChange={setDueDate} />}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => addTodo(urgency)}>
                    Add it
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddForm(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTitle("");
                  setDueDate(todayISO());
                  setNoSpecificDate(false);
                  setShowAddForm(urgency);
                }}
                className="m-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted hover:text-ink hover:border-border-bright transition-colors"
              >
                <Plus size={14} /> Add here
              </button>
            )}
          </Panel>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <Panel className="w-full max-w-md p-6 border border-border shadow-2xl relative bg-panel rounded-xl">
            <button
              onClick={() => setEditingTodo(null)}
              className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg text-ink mb-4">Change this task</h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-muted">What is it?</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="What do you need to do?"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-muted">When?</label>
                  <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted cursor-pointer hover:text-ink transition-colors">
                    <input 
                      type="checkbox" 
                      checked={editNoSpecificDate} 
                      onChange={(e) => setEditNoSpecificDate(e.target.checked)} 
                      className="accent-amber"
                    />
                    No specific date
                  </label>
                </div>
                {!editNoSpecificDate && <DatePicker value={editDueDate} onChange={setEditDueDate} />}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-muted">Move to</label>
                <select
                  value={editUrgency}
                  onChange={(e) => setEditUrgency(e.target.value as TodoUrgency)}
                  className="w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright transition-all appearance-none"
                >
                  {QUADRANTS.map((q) => (
                    <option key={q.urgency} value={q.urgency} className="bg-panel text-ink">
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={saveTodoEdit} disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save it"}
                </Button>
                <Button variant="ghost" onClick={() => setEditingTodo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
    </PageTransition>
    </>
  );
}
