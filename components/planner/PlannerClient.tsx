"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isSameYear,
  addMonths,
  subMonths,
  addWeeks,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { PlannerEvent } from "@/lib/types";
import { formatMoney, formatTime, cn, daysBetween, todayISO } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Wallet2, Trash2, Edit2, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { PageTransition } from "@/components/ui/PageTransition";

export function PlannerClient({ initialEvents }: { initialEvents: PlannerEvent[] }) {
  const supabase = createClient();
  const [events, setEvents] = useState(initialEvents);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSchedule, setIsSchedule] = useState(false);
  const [spend, setSpend] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  // Fetch Philippine holidays from Nager.Date API whenever the viewed year changes
  useEffect(() => {
    const year = month.getFullYear();
    const cacheKey = `ph_holidays_${year}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setHolidays((prev) => ({ ...prev, ...JSON.parse(cached) }));
      return;
    }
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`)
      .then((r) => r.json())
      .then((data: { date: string; localName: string }[]) => {
        const map: Record<string, string> = {};
        for (const h of data) {
          map[h.date] = h.localName;
        }
        localStorage.setItem(cacheKey, JSON.stringify(map));
        setHolidays((prev) => ({ ...prev, ...map }));
      })
      .catch(() => { });
  }, [month]);

  const [eventToDelete, setEventToDelete] = useState<PlannerEvent | null>(null);

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editIsSchedule, setEditIsSchedule] = useState(false);
  const [editSpend, setEditSpend] = useState("");
  const [editRepeatWeekly, setEditRepeatWeekly] = useState(false);
  const [editRepeatMonthly, setEditRepeatMonthly] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const EVENT_COLORS = [
    "border-blue-500/50 bg-blue-500/10",
    "border-purple-500/50 bg-purple-500/10",
    "border-emerald-500/50 bg-emerald-500/10",
    "border-pink-500/50 bg-pink-500/10",
    "border-cyan-500/50 bg-cyan-500/10",
    "border-indigo-500/50 bg-indigo-500/10",
    "border-rose-500/50 bg-rose-500/10",
  ];

  function getEventColor(title: string) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlannerEvent[]>();
    for (const e of events) {
      map.set(e.event_date, [...(map.get(e.event_date) ?? []), e]);
    }
    return map;
  }, [events]);

  const selectedEvents = [...(eventsByDate.get(selectedDate) ?? [])].sort((a, b) => {
    if (!a.event_time) return -1;
    if (!b.event_time) return 1;
    return a.event_time.localeCompare(b.event_time);
  });

  async function addEvent() {
    if (!title.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const plannedSpend = parseFloat(spend) || 0;

    let finalTime = null;
    let finalDesc = description.trim();
    if (isSchedule && time && endTime) {
      finalTime = time;
      finalDesc = `${finalDesc}\n[endTime:${endTime}]`.trim();
    } else if (time) {
      finalTime = time;
    }

    const baseEvent = {
      user_id: user.id,
      title: title.trim(),
      description: finalDesc || null,
      event_time: finalTime,
      planned_spend: plannedSpend,
    };

    const datesToCreate = [selectedDate];
    const baseDate = new Date(selectedDate + "T00:00:00");
    
    if (repeatWeekly) {
      let nextDate = addWeeks(baseDate, 1);
      while (isSameMonth(nextDate, baseDate)) {
        datesToCreate.push(format(nextDate, "yyyy-MM-dd"));
        nextDate = addWeeks(nextDate, 1);
      }
    } else if (repeatMonthly) {
      let nextDate = addWeeks(baseDate, 1);
      while (isSameYear(nextDate, baseDate)) {
        datesToCreate.push(format(nextDate, "yyyy-MM-dd"));
        nextDate = addWeeks(nextDate, 1);
      }
    }

    const eventsToInsert = datesToCreate.map((date) => ({
      ...baseEvent,
      event_date: date,
    }));

    const { data: insertedEvents, error } = await supabase
      .from("planner_events")
      .insert(eventsToInsert)
      .select();

    if (error) {
      alert("Error saving event: " + error.message);
      console.error(error);
      setSaving(false);
      return;
    }

    if (insertedEvents) {
      let finalEvents = insertedEvents as PlannerEvent[];

      if (plannedSpend > 0) {
        const txnsToInsert = finalEvents.map((evt) => ({
          user_id: user.id,
          amount: -Math.abs(plannedSpend),
          label: `${title.trim()} (planner)`,
          category: "planner",
          occurred_on: evt.event_date,
          planner_event_id: evt.id,
        }));

        const { data: txns } = await supabase
          .from("transactions")
          .insert(txnsToInsert)
          .select();

        if (txns) {
          for (const txn of txns) {
            await supabase
              .from("planner_events")
              .update({ transaction_id: txn.id })
              .eq("id", txn.planner_event_id);
            
            const idx = finalEvents.findIndex((e) => e.id === txn.planner_event_id);
            if (idx !== -1) {
              finalEvents[idx].transaction_id = txn.id;
            }
          }
        }
      }

      setEvents((prev) => [...prev, ...finalEvents]);
      setTitle("");
      setDescription("");
      setTime("");
      setEndTime("");
      setSpend("");
      setRepeatWeekly(false);
      setRepeatMonthly(false);
      setIsSchedule(false);
      setShowForm(false);
    }
    setSaving(false);
  }

  function removeEvent(event: PlannerEvent) {
    const hasFuture = events.some(e => e.title === event.title && e.event_date > event.event_date);
    if (hasFuture) {
      setEventToDelete(event);
    } else {
      executeDelete(event, false);
    }
  }

  async function executeDelete(e: PlannerEvent, deleteAllFuture: boolean) {
    setEventToDelete(null);
    if (deleteAllFuture) {
      await supabase.from("planner_events").delete().eq("title", e.title).gte("event_date", e.event_date);
      setEvents(prev => prev.filter(x => !(x.title === e.title && x.event_date >= e.event_date)));
      await supabase.from("transactions").delete().eq("label", `${e.title} (planner)`).gte("occurred_on", e.event_date);
    } else {
      await supabase.from("planner_events").delete().eq("id", e.id);
      setEvents(prev => prev.filter(x => x.id !== e.id));
      if (e.transaction_id) {
        await supabase.from("transactions").delete().eq("id", e.transaction_id);
      }
    }
  }

  function openEditModal(event: PlannerEvent) {
    setEditingEvent(event);
    setEditTitle(event.title);
    
    let rawDesc = event.description || "";
    const match = rawDesc.match(/\[endTime:(.*?)\]/);
    if (match) {
      setEditTime(event.event_time || "");
      setEditEndTime(match[1]);
      setEditIsSchedule(true);
      setEditDescription(rawDesc.replace(match[0], "").trim());
    } else {
      setEditTime(event.event_time || "");
      setEditEndTime("");
      setEditIsSchedule(false);
      setEditDescription(rawDesc);
    }
    
    setEditSpend(String(event.planned_spend || ""));
    setEditRepeatWeekly(false);
    setEditRepeatMonthly(false);
  }

  async function saveEventEdit() {
    if (!editingEvent || !editTitle.trim()) return;
    setSavingEdit(true);

    const plannedSpend = parseFloat(editSpend) || 0;

    let finalTime = null;
    let finalDesc = editDescription.trim();
    if (editIsSchedule && editTime && editEndTime) {
      finalTime = editTime;
      finalDesc = `${finalDesc}\n[endTime:${editEndTime}]`.trim();
    } else if (editTime) {
      finalTime = editTime;
    }

    // Update planner event
    const { error } = await supabase
      .from("planner_events")
      .update({
        title: editTitle.trim(),
        description: finalDesc || null,
        event_time: finalTime,
        planned_spend: plannedSpend,
      })
      .eq("id", editingEvent.id);

    if (!error) {
      // Sync budget transaction if it already exists or if planned spend became positive
      if (editingEvent.transaction_id) {
        if (plannedSpend > 0) {
          await supabase
            .from("transactions")
            .update({
              amount: -Math.abs(plannedSpend),
              label: `${editTitle.trim()} (planner)`,
              occurred_on: editingEvent.event_date,
            })
            .eq("id", editingEvent.transaction_id);
        } else {
          // Delete transaction if budget set to 0
          await supabase.from("transactions").delete().eq("id", editingEvent.transaction_id);
        }
      } else if (plannedSpend > 0) {
        // Create new transaction since budget was added
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: txn } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              amount: -Math.abs(plannedSpend),
              label: `${editTitle.trim()} (planner)`,
              category: "planner",
              occurred_on: editingEvent.event_date,
              planner_event_id: editingEvent.id,
            })
            .select()
            .single();

          if (txn) {
            await supabase
              .from("planner_events")
              .update({ transaction_id: txn.id })
              .eq("id", editingEvent.id);
            editingEvent.transaction_id = txn.id;
          }
        }
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? {
              ...e,
              title: editTitle.trim(),
              description: finalDesc || null,
              event_time: finalTime,
              planned_spend: plannedSpend,
              transaction_id: editingEvent.transaction_id,
            }
            : e
        )
      );

      // Create new future events if repeat was checked
      const datesToCreate: string[] = [];
      const baseDate = new Date(editingEvent.event_date + "T00:00:00");
      if (editRepeatWeekly) {
        let nextDate = addWeeks(baseDate, 1);
        while (isSameMonth(nextDate, baseDate)) {
          datesToCreate.push(format(nextDate, "yyyy-MM-dd"));
          nextDate = addWeeks(nextDate, 1);
        }
      } else if (editRepeatMonthly) {
        let nextDate = addWeeks(baseDate, 1);
        while (isSameYear(nextDate, baseDate)) {
          datesToCreate.push(format(nextDate, "yyyy-MM-dd"));
          nextDate = addWeeks(nextDate, 1);
        }
      }

      if (datesToCreate.length > 0) {
        const eventsToInsert = datesToCreate.map((date) => ({
          user_id: editingEvent.user_id,
          title: editTitle.trim(),
          description: finalDesc || null,
          event_time: finalTime,
          planned_spend: plannedSpend,
          event_date: date,
        }));

        const { data: insertedEvents } = await supabase
          .from("planner_events")
          .insert(eventsToInsert)
          .select();

        if (insertedEvents) {
          let finalEvents = insertedEvents as PlannerEvent[];
          if (plannedSpend > 0) {
            const txnsToInsert = finalEvents.map((evt) => ({
              user_id: editingEvent.user_id,
              amount: -Math.abs(plannedSpend),
              label: `${editTitle.trim()} (planner)`,
              category: "planner",
              occurred_on: evt.event_date,
              planner_event_id: evt.id,
            }));

            const { data: txns } = await supabase
              .from("transactions")
              .insert(txnsToInsert)
              .select();

            if (txns) {
              for (const txn of txns) {
                await supabase
                  .from("planner_events")
                  .update({ transaction_id: txn.id })
                  .eq("id", txn.planner_event_id);
                const idx = finalEvents.findIndex((e) => e.id === txn.planner_event_id);
                if (idx !== -1) finalEvents[idx].transaction_id = txn.id;
              }
            }
          }
          setEvents((prev) => [...prev, ...finalEvents]);
        }
      }

      setEditingEvent(null);
    }
    setSavingEdit(false);
  }

  return (
    <>
      <CoverImage src="/calendar.webp" />
      <PageTransition>
        <div className="p-4 md:p-12 space-y-8 w-full">
          <header>
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
              My Schedule
            </p>
            <h1 className="font-display text-3xl text-ink">Calendar Appointments</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel className="lg:col-span-2 p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-ink">
                  {format(month, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setMonth((m) => subMonths(m, 1))}
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-ink transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setMonth((m) => addMonths(m, 1))}
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-ink transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 font-mono text-[9px] md:text-[10px] uppercase text-muted mb-2">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const iso = format(day, "yyyy-MM-dd");
                  const holidayName = holidays[iso];
                  const dayEvents = eventsByDate.get(iso) ?? [];
                  const inMonth = isSameMonth(day, month);
                  const selected = isSameDay(day, new Date(selectedDate + "T00:00:00"));
                  const hasEvents = dayEvents.length > 0;

                  let toneColor = "text-danger";
                  let selectedBoxClass = "border-2 border-danger bg-danger/20";
                  let unselectedBoxClass = "border border-danger/50 bg-danger/10";

                  if (hasEvents) {
                    const daysLeft = daysBetween(iso, todayISO());
                    if (daysLeft > 5) {
                      toneColor = "text-teal";
                      selectedBoxClass = "border-2 border-teal bg-teal/20";
                      unselectedBoxClass = "border border-teal/50 bg-teal/10";
                    }
                    else if (daysLeft >= 2) {
                      toneColor = "text-amber";
                      selectedBoxClass = "border-2 border-amber bg-amber/20";
                      unselectedBoxClass = "border border-amber/50 bg-amber/10";
                    }
                  }

                  let boxClass = "border-border hover:border-border-bright";
                  if (selected) {
                    if (hasEvents) {
                      boxClass = selectedBoxClass;
                    } else {
                      boxClass = "border-2 border-[#3b82f6] bg-[#3b82f6]/10";
                    }
                  } else if (hasEvents) {
                    boxClass = unselectedBoxClass;
                  }

                  return (
                    <button
                      key={iso}
                      onClick={() => {
                        setSelectedDate(iso);
                        setShowForm(false);
                      }}
                      className={cn(
                        "aspect-square rounded-lg p-1 md:p-1.5 text-left flex flex-col transition-colors relative",
                        boxClass,
                        !inMonth && "opacity-30"
                      )}
                    >
                      <span className={cn("font-mono text-[11px]", hasEvents ? cn("font-semibold", toneColor) : "text-ink")}>{format(day, "d")}</span>
                      {holidayName && (
                        <span className="text-[9px] text-amber leading-none mt-0.5 truncate max-w-full font-sans" title={holidayName}>
                          {holidayName}
                        </span>
                      )}
                      {hasEvents && (
                        <span className={cn("mt-auto font-mono text-[9px]", toneColor)}>
                          {dayEvents.length} appointment{dayEvents.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 font-mono text-[9px] md:text-[10px] uppercase tracking-wider text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal"></span> {">"} 5 days away</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber"></span> 2 - 5 days away</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger"></span> Less than 2 days</span>
              </div>
            </Panel>

            <Panel className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1">
                {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMM d")}
              </p>
              <h3 className="font-display text-lg text-ink mb-4">What's the event?</h3>

              <div className="space-y-3 mb-4">
                {holidays[selectedDate] && (
                  <div className="rounded-lg border border-amber/20 bg-amber/5 p-3 text-xs text-amber font-sans">
                    Holiday: {holidays[selectedDate]}
                  </div>
                )}
                {selectedEvents.length === 0 && !holidays[selectedDate] && (
                  <p className="text-sm text-muted">Free day — nothing planned!</p>
                )}
                {selectedEvents.map((e) => {
                  let displayTime = e.event_time ? formatTime(e.event_time) : "";
                  let cleanDesc = e.description || "";
                  const match = cleanDesc.match(/\[endTime:(.*?)\]/);
                  if (match && e.event_time) {
                    displayTime = `${formatTime(e.event_time)} - ${formatTime(match[1])}`;
                    cleanDesc = cleanDesc.replace(match[0], "").trim();
                  }

                  let isFinished = e.event_date < todayISO();
                  if (e.event_date === todayISO()) {
                    const now = new Date();
                    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                    let compareTime = e.event_time;
                    if (match) compareTime = match[1]; // Use end time if exists
                    if (compareTime && compareTime < currentTime) {
                      isFinished = true;
                    }
                  }

                  const eventColor = getEventColor(e.title);

                  return (
                    <div
                      key={e.id}
                      className={cn("group rounded-lg border-2 p-3", eventColor)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-ink font-semibold break-words">{e.title}</p>
                            {isFinished && (
                              <span className="font-mono text-[9px] uppercase tracking-wider text-muted bg-base px-1.5 py-0.5 rounded border border-border">
                                Finished
                              </span>
                            )}
                          </div>
                          {displayTime && (
                            <p className="font-mono text-[10px] text-muted mt-0.5">{displayTime}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(e)}
                            className="text-muted hover:text-amber p-1 hover:bg-panel-raised rounded transition-colors"
                            title="Edit event"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => removeEvent(e)}
                            className="text-muted hover:text-danger p-1 hover:bg-panel-raised rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {cleanDesc && (
                        <p className="text-xs text-muted mt-1.5 break-words">{cleanDesc}</p>
                      )}
                      {e.planned_spend > 0 && (
                        <p className="flex items-center gap-1 font-mono text-xs text-amber mt-2">
                          <Wallet2 size={12} /> {formatMoney(e.planned_spend)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {showForm ? (
                <div className="space-y-2">
                  <Input
                    autoFocus
                    placeholder="What's happening?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Any extra info? (optional)"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-2 mb-1">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={isSchedule} 
                        onChange={(e) => setIsSchedule(e.target.checked)} 
                        className="accent-amber"
                      />
                      Add an end time
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted ml-1">
                        {isSchedule ? "Start Time" : "Time"}
                      </label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                    {isSchedule ? (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-muted ml-1">End Time</label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-muted ml-1">Spend (₱)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="How much?"
                          value={spend}
                          onChange={(e) => setSpend(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  {isSchedule && (
                    <div className="space-y-1 mt-2">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted ml-1">Spend (₱)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="How much?"
                        value={spend}
                        onChange={(e) => setSpend(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 mt-3 mb-2 border-t border-border/40 pt-3">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={repeatWeekly} 
                        onChange={(e) => {
                          setRepeatWeekly(e.target.checked);
                          if (e.target.checked) setRepeatMonthly(false);
                        }} 
                        className="accent-amber"
                      />
                      Repeat weekly this month
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={repeatMonthly} 
                        onChange={(e) => {
                          setRepeatMonthly(e.target.checked);
                          if (e.target.checked) setRepeatWeekly(false);
                        }} 
                        className="accent-amber"
                      />
                      Repeat weekly this year
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={saving} onClick={addEvent}>
                      {saving ? "Saving..." : "Add it"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" className="w-full" onClick={() => setShowForm(true)}>
                  + Schedule something
                </Button>
              )}
            </Panel>
          </div>

          {/* Edit Modal */}
          {editingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
              <Panel className="w-full max-w-md p-6 border border-border shadow-2xl relative bg-panel rounded-xl">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
                >
                  <X size={18} />
                </button>

                <h3 className="font-display text-lg text-ink mb-4">Change this event</h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-muted">What is it?</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="What's happening?"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-muted">Extra info</label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Any extra info?"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={editIsSchedule} 
                        onChange={(e) => setEditIsSchedule(e.target.checked)} 
                        className="accent-amber"
                      />
                      Add an end time
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted">{editIsSchedule ? "Start Time" : "Time"}</label>
                      <Input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                      />
                    </div>
                    {editIsSchedule ? (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-muted">End Time</label>
                        <Input
                          type="time"
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-muted">How much? (₱)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="How much?"
                          value={editSpend}
                          onChange={(e) => setEditSpend(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {editIsSchedule && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-muted">How much? (₱)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="How much?"
                        value={editSpend}
                        onChange={(e) => setEditSpend(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 mt-3 mb-2 border-t border-border/40 pt-3">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={editRepeatWeekly} 
                        onChange={(e) => {
                          setEditRepeatWeekly(e.target.checked);
                          if (e.target.checked) setEditRepeatMonthly(false);
                        }} 
                        className="accent-amber"
                      />
                      Repeat weekly this month
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted cursor-pointer hover:text-ink transition-colors">
                      <input 
                        type="checkbox" 
                        checked={editRepeatMonthly} 
                        onChange={(e) => {
                          setEditRepeatMonthly(e.target.checked);
                          if (e.target.checked) setEditRepeatWeekly(false);
                        }} 
                        className="accent-amber"
                      />
                      Repeat weekly this year
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={saveEventEdit} disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save it"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingEvent(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {/* Delete Modal */}
          {eventToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
              <Panel className="w-full max-w-sm p-6 border border-border shadow-2xl relative bg-panel rounded-xl">
                <h3 className="font-display text-lg text-ink mb-2">Delete Event</h3>
                <p className="text-sm text-muted mb-6">
                  This looks like a recurring event. Do you want to delete only this one, or this and all future events like it?
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => executeDelete(eventToDelete, true)} className="w-full bg-danger text-base hover:bg-danger/90">
                    Delete this & the rest
                  </Button>
                  <Button onClick={() => executeDelete(eventToDelete, false)} className="w-full border-border bg-base text-ink hover:bg-panel-raised">
                    Delete this only
                  </Button>
                  <Button variant="ghost" onClick={() => setEventToDelete(null)} className="w-full mt-2">
                    Cancel
                  </Button>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </PageTransition>
    </>
  );
}
