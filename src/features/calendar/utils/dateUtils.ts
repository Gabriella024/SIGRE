import type { CalendarView } from "../types/calendar";

const LOCALE = "es-CO";

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function addMonths(date: Date, amount: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), daysInTarget));
  return target;
}

export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return addDays(startOfDay(date), -offset);
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getMonthMatrix(date: Date): Date[] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function timeParts(date: Date): { text: string; meridiem: "AM" | "PM" } {
  const hours = date.getHours();
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return {
    text: `${hours12}:${String(date.getMinutes()).padStart(2, "0")}`,
    meridiem: hours >= 12 ? "PM" : "AM",
  };
}

export function formatTimeRange(start: Date, end: Date): string {
  const a = timeParts(start);
  const b = timeParts(end);
  return a.meridiem === b.meridiem
    ? `${a.text} - ${b.text} ${b.meridiem}`
    : `${a.text} ${a.meridiem} - ${b.text} ${b.meridiem}`;
}

export function formatHourLabel(hour: number): string {
  const hours12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hours12} ${hour >= 12 ? "PM" : "AM"}`;
}

export function formatMonthYear(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(date),
  );
}

export function formatLongDate(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat(LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
  );
}

export function formatShortWeekday(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

export function formatRangeTitle(view: CalendarView, date: Date): string {
  if (view === "month") return formatMonthYear(date);
  if (view === "day") return formatLongDate(date);

  const first = startOfWeek(date);
  const last = addDays(first, 6);
  const format = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
  return `${format.format(first).replace(".", "")} – ${format.format(last).replace(".", "")}, ${last.getFullYear()}`;
}