"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Transaction, Todo, Deadline, Goal, PlannerEvent } from "@/lib/types";
import { formatMoney, formatDate, todayISO, daysBetween, cn } from "@/lib/utils";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { CoverImage } from "@/components/ui/CoverImage";
import { PageTransition } from "@/components/ui/PageTransition";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2 } from "lucide-react";

export function DashboardClient({
  transactions,
  todos,
  deadlines,
  goals,
  events,
}: {
  transactions: Transaction[];
  todos: Todo[];
  deadlines: Deadline[];
  goals: Goal[];
  events: PlannerEvent[];
}) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Try localStorage first for instant render
    const cached = localStorage.getItem("display_name");
    if (cached) {
      setDisplayName(cached);
    }
    // Then check Supabase user metadata
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = user?.user_metadata?.display_name;
      if (name) {
        setDisplayName(name);
        localStorage.setItem("display_name", name);
      }
    });
  }, []);

  async function handleResetAll() {
    if (resetConfirm !== "RESET") return;
    setIsResetting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await supabase.from("todos").delete().eq("user_id", user.id);
      await supabase.from("deadlines").delete().eq("user_id", user.id);
      await supabase.from("goals").delete().eq("user_id", user.id);
      await supabase.from("events").delete().eq("user_id", user.id);
    }
    window.location.reload();
  }

  const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const openTodos = todos.filter((t) => t.urgency !== "accomplished");
  const urgentCount = todos.filter((t) => t.urgency === "urgent").length;
  const upcomingDeadlines = deadlines
    .filter((d) => !d.completed_at)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);
  const today = todayISO();
  const upcomingEvents = events
    .filter((e) => e.event_date >= today)
    .slice(0, 4);

  const greeting = displayName ? `Hey, ${displayName}!` : "Hey there!";

  return (
    <>
      <CoverImage src="/cover.jpg" darkSrc="/cover-dark.jpg" />
      <PageTransition>
        <div className="p-4 md:p-12 space-y-8 w-full">
          <header>
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
              Home
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{greeting}</h1>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Link href="/budget">
              <Panel className="p-5 hover:border-border-bright transition-colors">
                <p className="font-mono text-[11px] uppercase text-muted mb-1.5">Balance</p>
                <p className="font-mono text-lg sm:text-2xl text-amber tabular-nums truncate">{formatMoney(balance)}</p>
              </Panel>
            </Link>
            <Link href="/todos">
              <Panel className="p-5 hover:border-border-bright transition-colors">
                <p className="font-mono text-[11px] uppercase text-muted mb-1.5">Tasks REMAINING</p>
                <p className="font-mono text-2xl text-ink tabular-nums">{openTodos.length}</p>
              </Panel>
            </Link>
            <Link href="/todos">
              <Panel className="p-5 hover:border-border-bright transition-colors">
                <p className="font-mono text-[11px] uppercase text-muted mb-1.5">URGENT TASK</p>
                <p className="font-mono text-2xl text-urgent tabular-nums">{urgentCount}</p>
              </Panel>
            </Link>
            <Link href="/deadlines">
              <Panel className="p-5 hover:border-border-bright transition-colors">
                <p className="font-mono text-[11px] uppercase text-muted mb-1.5">ALMOST DUE</p>
                <p className="font-mono text-2xl text-ink tabular-nums">
                  {deadlines.filter((d) => !d.completed_at).length}
                </p>
              </Panel>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel>
              <PanelHeader eyebrow="Heads up" title="Deadlines coming" />
              <div className="p-5 pt-3 space-y-2">
                {upcomingDeadlines.length === 0 && (
                  <p className="text-sm text-muted py-4 text-center">Nothing due — you're free!</p>
                )}
                {upcomingDeadlines.map((d) => {
                  const daysLeft = daysBetween(d.due_date, today);
                  let toneColor = "text-red-500 bg-red-500/10 border-red-500/20";
                  if (daysLeft > 5) toneColor = "text-teal bg-teal/10 border-teal/20";
                  else if (daysLeft >= 2) toneColor = "text-amber bg-amber/10 border-amber/20";

                  return (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{d.title}</span>
                      <span className={cn("font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border", toneColor)}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} DAYS OVERDUE` : `${daysLeft} DAYS LEFT`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <PanelHeader eyebrow="Coming up" title="Appointments" />
              <div className="p-5 pt-3 space-y-2">
                {upcomingEvents.length === 0 && (
                  <p className="text-sm text-muted py-4 text-center">Nothing on the calendar yet.</p>
                )}
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{e.title}</span>
                    <span className="font-mono text-xs text-muted">{formatDate(e.event_date)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {goals.length > 0 && (
            <Panel>
              <PanelHeader eyebrow="Goals" title="How I'm doing" />
              <div className="p-5 pt-3 space-y-4">
                {goals.slice(0, 4).map((g) => (
                  <ProgressGauge
                    key={g.id}
                    label={g.title}
                    current={g.current_count}
                    target={g.target_count}
                  />
                ))}
              </div>
            </Panel>
          )}

          <div className="pt-12 pb-4 flex justify-center">
            <button
              onClick={() => setShowReset(true)}
              className="text-xs text-muted hover:text-danger transition-colors font-mono uppercase tracking-widest flex items-center gap-2 border border-transparent hover:border-danger/20 px-4 py-2 rounded-lg"
            >
              <Trash2 size={13} />
              Restart Tasks & Finance
            </button>
          </div>
        </div>

        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/90 backdrop-blur-sm">
            <Panel className="w-full max-w-md p-6 border-danger/30 shadow-2xl relative bg-panel rounded-xl">
              <h3 className="font-display text-2xl text-danger mb-2">Erase everything?</h3>
              <p className="text-sm text-muted mb-6">
                This will delete all your tasks, deadlines, goals, planner events, and budget history. This action cannot be undone.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-muted mb-1.5 block">
                    Type RESET to confirm
                  </label>
                  <Input
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    placeholder="RESET"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger/30 border-danger/20"
                    onClick={handleResetAll}
                    disabled={isResetting || resetConfirm !== "RESET"}
                  >
                    {isResetting ? "Erasing..." : "Erase my account data"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowReset(false); setResetConfirm(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </PageTransition>
    </>
  );
}
