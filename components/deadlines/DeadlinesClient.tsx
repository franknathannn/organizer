"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Deadline } from "@/lib/types";
import { formatDate, todayISO, daysBetween, cn } from "@/lib/utils";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash2, Plus, Edit2, RotateCcw, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { PageTransition } from "@/components/ui/PageTransition";

export function DeadlinesClient({
  initialDeadlines,
}: {
  initialDeadlines: Deadline[];
}) {
  const supabase = createClient();
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [toast, setToast] = useState<string | null>(null);

  // Edit Modal State
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const { pending, completed } = useMemo(() => {
    const pending = deadlines
      .filter((d) => !d.completed_at)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    const completed = deadlines
      .filter((d) => d.completed_at)
      .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    return { pending, completed };
  }, [deadlines]);

  async function addDeadline() {
    if (!title.trim() || !dueDate) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("deadlines")
      .insert({
        user_id: user.id,
        title: title.trim(),
        notes: notes.trim() || null,
        due_date: dueDate,
      })
      .select()
      .single();

    if (!error && data) {
      setDeadlines((prev) => [...prev, data as Deadline]);
      setTitle("");
      setNotes("");
      setDueDate(todayISO());
      setShowForm(false);
    }
  }

  async function completeDeadline(d: Deadline) {
    const now = new Date().toISOString();
    setDeadlines((prev) =>
      prev.map((x) => (x.id === d.id ? { ...x, completed_at: now } : x))
    );
    await supabase.from("deadlines").update({ completed_at: now }).eq("id", d.id);

    const diff = daysBetween(d.due_date, now.slice(0, 10));
    if (diff > 0) setToast(`"${d.title}" finished ${diff} day${diff === 1 ? "" : "s"} early. Nice.`);
    else if (diff === 0) setToast(`"${d.title}" finished right on the due date.`);
    else setToast(`"${d.title}" finished ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} late.`);
    setTimeout(() => setToast(null), 4000);
  }

  async function reopenDeadline(d: Deadline) {
    setDeadlines((prev) =>
      prev.map((x) => (x.id === d.id ? { ...x, completed_at: null } : x))
    );
    await supabase.from("deadlines").update({ completed_at: null }).eq("id", d.id);
    setToast(`"${d.title}" is back on your list!`);
    setTimeout(() => setToast(null), 3000);
  }

  async function removeDeadline(id: string) {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
    await supabase.from("deadlines").delete().eq("id", id);
  }

  function openEditModal(d: Deadline) {
    setEditingDeadline(d);
    setEditTitle(d.title);
    setEditNotes(d.notes || "");
    setEditDueDate(d.due_date);
  }

  async function saveDeadlineEdit() {
    if (!editingDeadline || !editTitle.trim()) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("deadlines")
      .update({
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
        due_date: editDueDate,
      })
      .eq("id", editingDeadline.id);

    if (!error) {
      setDeadlines((prev) =>
        prev.map((d) =>
          d.id === editingDeadline.id
            ? {
                ...d,
                title: editTitle.trim(),
                notes: editNotes.trim() || null,
                due_date: editDueDate,
              }
            : d
        )
      );
      setEditingDeadline(null);
    }
    setSavingEdit(false);
  }

  return (
    <>
      <CoverImage src="/deadline.webp" />
      <PageTransition>
      <div className="p-4 md:p-12 space-y-8 w-full relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-6 right-6 z-50 rounded-lg border border-amber/40 bg-panel-raised px-4 py-3 text-sm text-ink shadow-panel"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header>
        <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
          Deadlines
        </p>
        <h1 className="font-display text-3xl text-ink">Stuff I gotta finish</h1>
      </header>

      <Panel>
        <PanelHeader
          eyebrow={`${pending.length} left`}
          title="Coming up"
          action={
            <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
              <Plus size={15} /> New
            </Button>
          }
        />

        {showForm && (
          <div className="mx-5 mt-4 space-y-3 rounded-lg border border-border p-4 bg-panel-raised/40">
            <Input
              autoFocus
              placeholder="What do you gotta get done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Any details? (optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-muted">When is it due?</label>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={addDeadline}>
                Add it
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="p-5 pt-3 space-y-2">
          {pending.length === 0 && !showForm && (
            <p className="text-sm text-muted text-center py-6">
              All clear — nothing due right now! 🎉
            </p>
          )}
          {pending.map((d) => {
            const daysLeft = daysBetween(d.due_date, todayISO());
            const tone = daysLeft < 0 ? "urgent" : daysLeft <= 2 ? "soon" : "later";
            return (
              <div
                key={d.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-panel-raised/50 p-3"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => completeDeadline(d)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-border-bright hover:border-done hover:bg-done/10 transition-colors"
                    title="Mark finished"
                  />
                  <div>
                    <p className="text-sm text-ink font-medium">{d.title}</p>
                    {d.notes && <p className="text-xs text-muted mt-0.5">{d.notes}</p>}
                    <div className="mt-1.5">
                      {(() => {
                        let toneColor = "text-red-500 bg-red-500/10 border-red-500/20";
                        if (daysLeft > 5) toneColor = "text-teal bg-teal/10 border-teal/20";
                        else if (daysLeft >= 2) toneColor = "text-amber bg-amber/10 border-amber/20";
                        return (
                          <span className={cn("font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border", toneColor)}>
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)} DAYS OVERDUE`
                              : daysLeft === 0
                              ? "DUE TODAY"
                              : `${daysLeft} DAYS LEFT · ${formatDate(d.due_date)}`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(d)}
                    className="text-muted hover:text-amber p-1 hover:bg-panel-raised rounded transition-colors"
                    title="Edit deadline"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => removeDeadline(d.id)}
                    className="text-muted hover:text-danger p-1 hover:bg-panel-raised rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pb-2 font-mono text-[9px] md:text-[10px] uppercase tracking-wider text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal"></span> {">"} 5 days left</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber"></span> 2 - 5 days left</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger"></span> Less than 2 days / Overdue</span>
        </div>
      </Panel>

      {completed.length > 0 && (
        <Panel>
          <PanelHeader eyebrow={`${completed.length} done`} title="Knocked out" />
          <div className="p-5 pt-3 space-y-2">
            {completed.map((d) => {
              const diff = daysBetween(d.due_date, (d.completed_at ?? "").slice(0, 10));
              return (
                <div
                  key={d.id}
                  className="group flex items-center justify-between rounded-lg border border-border bg-panel-raised/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-done" />
                    <p className="text-sm text-muted line-through">{d.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={diff > 0 ? "done" : diff === 0 ? "muted" : "urgent"}>
                      {diff > 0 ? `${diff}d early` : diff === 0 ? "On time" : `${Math.abs(diff)}d late`}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => reopenDeadline(d)}
                        className="text-muted hover:text-teal p-1 hover:bg-panel-raised rounded transition-colors"
                        title="Put it back"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={() => removeDeadline(d.id)}
                        className="text-muted hover:text-danger p-1 hover:bg-panel-raised rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Edit Modal */}
      {editingDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <Panel className="w-full max-w-md p-6 border border-border shadow-2xl relative bg-panel rounded-xl">
            <button
              onClick={() => setEditingDeadline(null)}
              className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg text-ink mb-4">Change it up</h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-muted">What is it?</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="What do you gotta get done?"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-muted">Details</label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any extra info?"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-muted">When is it due?</label>
                <DatePicker value={editDueDate} onChange={setEditDueDate} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={saveDeadlineEdit} disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save it"}
                </Button>
                <Button variant="ghost" onClick={() => setEditingDeadline(null)}>
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
