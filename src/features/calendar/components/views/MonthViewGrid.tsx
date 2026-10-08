import { useMemo } from "react";
import { formatShortWeekday, getMonthMatrix, getWeekDays, isSameDay, isSameMonth } from "../../utils/dateUtils";
import { CATEGORY_STYLES } from "../../utils/calendarUtils";
import type { CalendarSession } from "../../types/calendar";

interface MonthViewGridProps {
  date: Date;
  selectedDate: Date;
  sessions: CalendarSession[];
  onSelectDate?: (date: Date) => void;
  onSelectSession?: (session: CalendarSession) => void;
  maxVisible?: number;
}

export default function MonthViewGrid({
  date,
  selectedDate,
  sessions,
  onSelectDate,
  onSelectSession,
  maxVisible = 3,
}: MonthViewGridProps) {
  const matrix = useMemo(() => getMonthMatrix(date), [date]);
  const weekdays = useMemo(() => getWeekDays(date), [date]);
  const today = useMemo(() => new Date(), []);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {weekdays.map((day) => (
            <span
              key={day.getDay()}
              className="py-2 text-center text-[11px] font-medium tracking-wide text-slate-400"
            >
              {formatShortWeekday(day)}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {matrix.map((day) => {
            const inMonth = isSameMonth(day, date);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const daySessions = sessions
              .filter((session) => isSameDay(session.start, day))
              .sort((a, b) => a.start.getTime() - b.start.getTime());
            const hidden = daySessions.length - maxVisible;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-28 border-b border-l border-slate-100 p-1.5 ${inMonth ? "bg-white" : "bg-slate-50/70"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate?.(day)}
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${isToday
                      ? "bg-lime-900 text-white"
                      : isSelected
                        ? "text-slate-900 ring-1 ring-slate-300"
                        : inMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300"
                    }`}
                >
                  {day.getDate()}
                </button>

                <ul className="space-y-1">
                  {daySessions.slice(0, maxVisible).map((session) => (
                    <li key={session.id}>
                      <button
                        type="button"
                        onClick={() => onSelectSession?.(session)}
                        title={session.title}
                        className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium ${CATEGORY_STYLES[session.category].bg} ${CATEGORY_STYLES[session.category].text}`}
                      >
                        {session.title}
                      </button>
                    </li>
                  ))}
                  {hidden > 0 && (
                    <li>
                      <button
                        type="button"
                        onClick={() => onSelectDate?.(day)}
                        className="px-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                      >
                        +{hidden} más
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}