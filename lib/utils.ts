import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMoney(amount: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d1.getTime() - d2.getTime()) / 86400000);
}

export function formatTime(timeStr: string) {
  if (!timeStr) return "";

  function formatSingleTime(t: string) {
    const parts = t.trim().split(":");
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1] || "00");
    if (isNaN(h) || isNaN(m)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    const minStr = String(m).padStart(2, "0");
    return `${hour12}:${minStr} ${ampm}`;
  }

  if (timeStr.includes("-")) {
    const [start, end] = timeStr.split("-");
    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  }

  return formatSingleTime(timeStr);
}
