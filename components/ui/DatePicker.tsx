"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  // Parse date value. Fallback to today if invalid
  const parsedDate = useMemo(() => {
    // Standard split is safer for timezone/ISO issues than new Date(value)
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const d = parseInt(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  }, [value]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear - 5; y <= currentYear + 10; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(parsedDate.year, parsedDate.month, 0).getDate();
  }, [parsedDate.year, parsedDate.month]);

  const days = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(d);
    }
    return list;
  }, [daysInMonth]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value);
    const maxDays = new Date(y, parsedDate.month, 0).getDate();
    const d = Math.min(parsedDate.day, maxDays);
    updateDate(y, parsedDate.month, d);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    const maxDays = new Date(parsedDate.year, m, 0).getDate();
    const d = Math.min(parsedDate.day, maxDays);
    updateDate(parsedDate.year, m, d);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = parseInt(e.target.value);
    updateDate(parsedDate.year, parsedDate.month, d);
  };

  const updateDate = (y: number, m: number, d: number) => {
    const yearStr = String(y);
    const monthStr = String(m).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    onChange(`${yearStr}-${monthStr}-${dayStr}`);
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2 w-full", className)}>
      <select
        value={parsedDate.month}
        onChange={handleMonthChange}
        className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright cursor-pointer transition-all appearance-none"
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1} className="bg-panel text-ink">
            {name}
          </option>
        ))}
      </select>

      <select
        value={parsedDate.day}
        onChange={handleDayChange}
        className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright cursor-pointer transition-all appearance-none"
      >
        {days.map((d) => (
          <option key={d} value={d} className="bg-panel text-ink">
            {d}
          </option>
        ))}
      </select>

      <select
        value={parsedDate.year}
        onChange={handleYearChange}
        className="rounded-md border border-border/60 bg-transparent px-3 py-2 text-sm text-ink focus:border-border-bright focus:outline-none focus:ring-1 focus:ring-border-bright cursor-pointer transition-all appearance-none"
      >
        {years.map((y) => (
          <option key={y} value={y} className="bg-panel text-ink">
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
