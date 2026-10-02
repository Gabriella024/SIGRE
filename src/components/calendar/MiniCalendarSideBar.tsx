import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Users, Video } from "lucide-react";
import {
  addMonths,
  formatLongDate,
  formatMonthYear,
  formatTimeRange,
  getMonthMatrix,
  isSameDay,
  isSameMonth,
} from "../../features/calendar/utils/dateUtils";
import { CATEGORY_STYLES, MODALITY_STYLES, getResponsible } from "../../features/calendar/utils/calendarUtils";
import type { CalendarSession } from "../../features/calendar/types/calendar";
 
interface MiniCalendarSidebarProps {
  selectedDate: Date;
  sessions: CalendarSession[];
  onSelectDate: (date: Date) => void;
}
 
const WEEKDAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"] as const;
 
export default function MiniCalendarSidebar({
  selectedDate,
  sessions,
  onSelectDate,
}: MiniCalendarSidebarProps) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate);

  useEffect(() => {
    setVisibleMonth(selectedDate);
  }, [selectedDate]);
 
  const today = useMemo(() => new Date(), []);
  const matrix = useMemo(() => getMonthMatrix(visibleMonth), [visibleMonth]);
 
  const daySessions = useMemo(
    () =>
      sessions
        .filter((session) => isSameDay(session.start, selectedDate))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [sessions, selectedDate],
  );
 
  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
      {/* Mini calendario */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{formatMonthYear(visibleMonth)}</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              aria-label="Mes anterior"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              aria-label="Mes siguiente"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
 
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
          {WEEKDAY_INITIALS.map((initial) => (
            <span key={initial} className="py-1">
              {initial}
            </span>
          ))}
        </div>
 
        <div className="grid grid-cols-7 gap-y-0.5">
          {matrix.map((day) => {
            const selected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const inMonth = isSameMonth(day, visibleMonth);
            const hasSessions = sessions.some((session) => isSameDay(session.start, day));
 
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                aria-label={formatLongDate(day)}
                aria-pressed={selected}
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  selected
                    ? "bg-slate-900 font-semibold text-white"
                    : isToday
                      ? "font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100"
                      : inMonth
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-300 hover:bg-slate-50"
                }`}
              >
                {day.getDate()}
                {hasSessions && (
                  <span
                    className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                      selected ? "bg-white" : "bg-emerald-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Todas las reuniones del día</h3>
        <p className="mb-3 text-xs text-slate-500">{formatLongDate(selectedDate)}</p>
 
        {daySessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
            No hay reuniones programadas.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {daySessions.map((session) => {
              const category = CATEGORY_STYLES[session.category];
              const modality = MODALITY_STYLES[session.modality];
              const responsible = getResponsible(session);
              const LocationIcon = session.modality === "virtual" ? Video : MapPin;
 
              return (
                <li
                  key={session.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatTimeRange(session.start, session.end)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${modality.bg} ${modality.text}`}
                    >
                      {modality.label}
                    </span>
                  </div>
 
                  <div className="mt-2 flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${category.dot}`} />
                    <p className="text-sm font-semibold leading-snug text-slate-800">
                      {session.title}
                    </p>
                  </div>
 
                  <dl className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <LocationIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {session.meetingUrl ? (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sky-700 underline-offset-2 hover:underline"
                        >
                          {session.location}
                        </a>
                      ) : (
                        <span className="truncate">{session.location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {responsible.role}: {responsible.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        {session.enrolled}
                        {session.capacity ? ` / ${session.capacity}` : ""} inscritos
                      </span>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
 