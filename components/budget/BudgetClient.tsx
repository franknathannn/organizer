"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/lib/types";
import { formatMoney, formatDate, todayISO, cn } from "@/lib/utils";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { ArrowDownCircle, ArrowUpCircle, Trash2, Edit2, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { PageTransition } from "@/components/ui/PageTransition";

const CATEGORIES = ["general", "food", "transport", "school", "leisure", "bills"];

export function BudgetClient({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [kind, setKind] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("general");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Edit Modal State
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editKind, setEditKind] = useState<"in" | "out">("out");
  const [editAmount, setEditAmount] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editDate, setEditDate] = useState(todayISO());
  const [savingEdit, setSavingEdit] = useState(false);

  const balance = useMemo(
    () => transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  );
  const totalIn = useMemo(
    () =>
      transactions.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );
  const totalOut = useMemo(
    () =>
      transactions.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (Number(t.amount) >= 0) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(Number(t.amount)));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const numeric = parseFloat(amount);
    if (!numeric || numeric <= 0 || !label.trim()) return;
    setSaving(true);

    const signedAmount = kind === "in" ? numeric : -numeric;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: signedAmount,
        label: label.trim(),
        category: kind === "in" ? "income" : category,
        occurred_on: date,
      })
      .select()
      .single();

    if (!error && data) {
      setTransactions((prev) =>
        [data as Transaction, ...prev].sort(
          (a, b) => b.occurred_on.localeCompare(a.occurred_on)
        )
      );
      setAmount("");
      setLabel("");
    }
    setSaving(false);
  }

  async function removeTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  }

  async function handleResetMoney() {
    if (resetConfirm !== "RESET") return;
    setIsResetting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("transactions").delete().eq("user_id", user.id);
    }
    window.location.reload();
  }

  function openEditModal(txn: Transaction) {
    setEditingTxn(txn);
    const isIncome = Number(txn.amount) >= 0;
    setEditKind(isIncome ? "in" : "out");
    setEditAmount(String(Math.abs(Number(txn.amount))));
    setEditLabel(txn.label);
    setEditCategory(txn.category);
    setEditDate(txn.occurred_on);
  }

  async function saveTransactionEdit() {
    if (!editingTxn) return;
    const numeric = parseFloat(editAmount);
    if (!numeric || numeric <= 0 || !editLabel.trim()) return;
    setSavingEdit(true);

    const signedAmount = editKind === "in" ? numeric : -numeric;

    const { error } = await supabase
      .from("transactions")
      .update({
        amount: signedAmount,
        label: editLabel.trim(),
        category: editKind === "in" ? "income" : editCategory,
        occurred_on: editDate,
      })
      .eq("id", editingTxn.id);

    if (!error) {
      setTransactions((prev) =>
        prev
          .map((t) =>
            t.id === editingTxn.id
              ? {
                ...t,
                amount: signedAmount,
                label: editLabel.trim(),
                category: editKind === "in" ? "income" : editCategory,
                occurred_on: editDate,
              }
              : t
          )
          .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
      );
      setEditingTxn(null);
    }
    setSavingEdit(false);
  }

  return (
    <>
      <CoverImage src="/money.webp" />
      <PageTransition>
        <div className="p-4 md:p-12 space-y-8 w-full">
          <header>
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
              My Money
            </p>
            <h1 className="font-display text-3xl text-ink">Where did it all go?</h1>
          </header>

          {/* Overview stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Panel className="p-5 min-w-0 overflow-hidden">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1.5">
                Balance
              </p>
              <p
                className={cn(
                  "font-mono text-2xl sm:text-3xl tabular-nums truncate",
                  balance >= 0 ? "text-amber" : "text-danger"
                )}
              >
                {formatMoney(balance)}
              </p>
            </Panel>
            <Panel className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1.5">
                Money In
              </p>
              <p className="font-mono text-2xl sm:text-3xl tabular-nums text-teal truncate">
                {formatMoney(totalIn)}
              </p>
            </Panel>
            <Panel className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1.5">
                Money Out
              </p>
              <p className="font-mono text-2xl sm:text-3xl tabular-nums text-danger truncate">
                {formatMoney(Math.abs(totalOut))}
              </p>
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel className="lg:col-span-2">
              <PanelHeader eyebrow="New" title="Got money coming in or going out?" />
              <form onSubmit={addTransaction} className="p-5 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setKind("in")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      kind === "in"
                        ? "border-teal/50 bg-teal/10 text-teal"
                        : "border-border text-muted hover:text-ink"
                    )}
                  >
                    <ArrowDownCircle size={16} /> Money in
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind("out")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      kind === "out"
                        ? "border-danger/50 bg-danger/10 text-danger"
                        : "border-border text-muted hover:text-ink"
                    )}
                  >
                    <ArrowUpCircle size={16} /> Money spent
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <DatePicker value={date} onChange={setDate} />
                </div>

                <Input
                  placeholder={kind === "in" ? "Source (allowance, part-time job...)" : "What did you spend it on?"}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />

                {kind === "out" && (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright transition-all appearance-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-panel text-ink">
                        {c[0].toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Log it"}
                </Button>
              </form>
            </Panel>

            <Panel className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-3">
                Where my money went
              </p>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted">No spending yet — keep it up!</p>
              ) : (
                <div className="space-y-3">
                  {byCategory.map(([cat, total], idx) => {
                    const pct = Math.min(100, (total / Math.abs(totalOut || 1)) * 100);
                    const isTop = idx === 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={cn("capitalize", isTop ? "text-amber font-semibold" : "text-ink")}>{cat}</span>
                          <span className={cn("font-mono", isTop ? "text-amber font-semibold" : "text-muted")}>{formatMoney(total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-base border border-border overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isTop ? "bg-amber" : "bg-amber/40"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          <Panel>
            <PanelHeader eyebrow="History" title="Spendings" />
            <div className="p-5 pt-3 divide-y divide-border">
              {transactions.length === 0 && (
                <p className="text-sm text-muted py-6 text-center">
                  Nothing here yet — log your first one above!
                </p>
              )}
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 group">
                  <div>
                    <p className="text-sm text-ink font-medium">{t.label}</p>
                    <p className="font-mono text-[11px] text-muted mt-0.5">
                      {formatDate(t.occurred_on)} · {t.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-mono text-sm tabular-nums",
                        Number(t.amount) >= 0 ? "text-teal" : "text-danger"
                      )}
                    >
                      {Number(t.amount) >= 0 ? "+" : ""}
                      {formatMoney(Number(t.amount))}
                    </span>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(t)}
                        className="text-muted hover:text-amber p-1 hover:bg-panel-raised rounded transition-colors"
                        title="Edit entry"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => removeTransaction(t.id)}
                        className="text-muted hover:text-danger p-1 hover:bg-panel-raised rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="pt-12 pb-4 flex justify-center">
            <button
              onClick={() => setShowReset(true)}
              className="text-xs text-muted hover:text-danger transition-colors font-mono uppercase tracking-widest flex items-center gap-2 border border-transparent hover:border-danger/20 px-4 py-2 rounded-lg"
            >
              <Trash2 size={13} />
              Restart Expenses
            </button>
          </div>

          {/* Edit Modal */}
          {editingTxn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
              <Panel className="w-full max-w-md p-6 border border-border shadow-2xl relative bg-panel rounded-xl">
                <button
                  onClick={() => setEditingTxn(null)}
                  className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
                >
                  <X size={18} />
                </button>

                <h3 className="font-display text-lg text-ink mb-4">Fix this entry</h3>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditKind("in")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        editKind === "in"
                          ? "border-teal/50 bg-teal/10 text-teal"
                          : "border-border text-muted hover:text-ink"
                      )}
                    >
                      <ArrowDownCircle size={16} /> Money in
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditKind("out")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        editKind === "out"
                          ? "border-danger/50 bg-danger/10 text-danger"
                          : "border-border text-muted hover:text-ink"
                      )}
                    >
                      <ArrowUpCircle size={16} /> Money spent
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted">How much?</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted">When?</label>
                      <DatePicker value={editDate} onChange={setEditDate} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-muted">What for?</label>
                    <Input
                      placeholder="What was it for?"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      required
                    />
                  </div>

                  {editKind === "out" && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted">Type</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright transition-all appearance-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="bg-panel text-ink">
                            {c[0].toUpperCase() + c.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={saveTransactionEdit} disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save it"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingTxn(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* Reset Modal */}
          {showReset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/90 backdrop-blur-sm">
              <Panel className="w-full max-w-md p-6 border-danger/30 shadow-2xl relative bg-panel rounded-xl">
                <h3 className="font-display text-2xl text-danger mb-2">Erase all transactions?</h3>
                <p className="text-sm text-muted mb-6">
                  This will delete all your income and spending history. This action cannot be undone.
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
                      onClick={handleResetMoney}
                      disabled={isResetting || resetConfirm !== "RESET"}
                    >
                      {isResetting ? "Erasing..." : "Erase my money data"}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowReset(false); setResetConfirm(""); }}>
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
