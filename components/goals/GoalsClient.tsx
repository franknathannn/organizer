"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/types";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { PageTransition } from "@/components/ui/PageTransition";

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const supabase = createClient();
  const [goals, setGoals] = useState(initialGoals);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("4");

  async function addGoal() {
    if (!title.trim()) return;
    const targetNum = Math.max(1, parseInt(target) || 1);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("goals")
      .insert({ user_id: user.id, title: title.trim(), target_count: targetNum, current_count: 0 })
      .select()
      .single();

    if (!error && data) {
      setGoals((prev) => [data as Goal, ...prev]);
      setTitle("");
      setTarget("4");
      setShowForm(false);
    }
  }

  async function step(goal: Goal, delta: number) {
    const next = Math.min(goal.target_count, Math.max(0, goal.current_count + delta));
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, current_count: next } : g)));
    await supabase.from("goals").update({ current_count: next }).eq("id", goal.id);
  }

  async function removeGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await supabase.from("goals").delete().eq("id", id);
  }

  return (
    <>
      <CoverImage src="/progress.webp" />
      <PageTransition>
      <div className="p-4 md:p-12 space-y-8 w-full">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
          Goals
        </p>
        <h1 className="font-display text-3xl text-ink">Am I getting there?</h1>
        <p className="text-sm text-muted mt-1">
          Track things step by step — like 2 out of 4 done = 50% there.
        </p>
      </header>

      <Panel>
        <PanelHeader
          title="My goals"
          action={
            <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
              <Plus size={15} /> Add goal
            </Button>
          }
        />

        {showForm && (
          <div className="mx-5 mt-4 space-y-2 rounded-lg border border-border p-4 bg-panel-raised/40">
            <Input
              autoFocus
              placeholder="What's the goal? (e.g. finish thesis chapters)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              type="number"
              min="1"
              placeholder="How many steps to finish?"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={addGoal}>
                Start tracking
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="p-5 pt-4 space-y-5">
          {goals.length === 0 && !showForm && (
            <p className="text-sm text-muted text-center py-6">
              No goals yet — start one and watch the bar fill up!
            </p>
          )}
          {goals.map((g) => (
            <div key={g.id} className="group flex items-center gap-4">
              <ProgressGauge
                label={g.title}
                current={g.current_count}
                target={g.target_count}
                className="flex-1"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => step(g, -1)}
                  className="rounded-md border border-border p-1.5 text-muted hover:text-ink"
                >
                  <Minus size={13} />
                </button>
                <button
                  onClick={() => step(g, 1)}
                  className="rounded-md border border-border p-1.5 text-muted hover:text-ink"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => removeGoal(g.id)}
                  className="opacity-100 sm:opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted hover:text-danger transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
    </PageTransition>
    </>
  );
}
