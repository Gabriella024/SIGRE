import { useEffect, useState } from "react";
import {
  formatHourLabel,
  formatShortWeekday,
  formatTimeRange,
  isSameDay,
  minutesOfDay,
} from "../../../features/calendar/utils/dateUtils";
import { CATEGORY_STYLES, MODALITY_STYLES } from "../../../features/calendar/utils/calendarUtils";
import type { CalendarSession } from "../../../features/calendar/types/calendar";

interface WeekViewGridProps {
  /** 7 días para la vista Semana, 1 día para la vista Día. */
  days: Date[];
  sessions: CalendarSession[];
  selectedDate: Date;
  onSelectDate?: (date: Date) => void;
  onSelectSession?: (session: CalendarSession) => void;
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
}

interface PositionedSession {
  session: CalendarSession;
  lane: number;
  lanes: number;
}

/** Reparte en "carriles" las sesiones que se solapan para que no se tapen entre sí. */
function layoutDay(sessions: CalendarSession[]): PositionedSession[] {
  const sorted = [...sessions].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime(),
  );

  const result: PositionedSession[] = [];
  let cluster: Array<{ session: CalendarSession; lane: number }> = [];
  let laneEnds: number[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flush = () => {
    const lanes = laneEnds.length;
    cluster.forEach((item) => result.push({ session: item.session, lane: item.lane, lanes }));
    cluster = [];
    laneEnds = [];
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  for (const session of sorted) {
    const start = session.start.getTime();
    if (cluster.length > 0 && start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(session.end.getTime());
    } else {
      laneEnds[lane] = session.end.getTime();
    }

    cluster.push({ session, lane });
    clusterEnd = Math.max(clusterEnd, session.end.getTime());
  }
  flush();

  return result;
}

export default function WeekViewGrid({
  days,
  sessions,
  selectedDate,
  onSelectDate,
  onSelectSession,
  startHour = 7,
  endHour = 17,
  hourHeight = 64,
}: WeekViewGridProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
  const totalHeight = (endHour - startHour) * hourHeight;
  const pxPerMinute = hourHeight / 60;
  const gridColumns = `56px repeat(${days.length}, minmax(0, 1fr))`;
  const multiDay = days.length > 1;

  return (
    <div className="overflow-auto">
      <div style={{ minWidth: multiDay ? 760 : 360 }} className="pb-4">
        {/* Cabecera de días */}
        <div
          className="sticky top-0 z-20 grid border-b border-slate-200 bg-white"
          style={{ gridTemplateColumns: gridColumns }}
        >
          <div />
          {days.map((day) => {
            const isToday = isSameDay(day, now);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate?.(day)}
                className="flex flex-col items-center gap-1 py-2 focus:outline-none focus-visible:bg-slate-50"
              >
                <span className="text-[11px] font-medium tracking-wide text-slate-400">
                  {formatShortWeekday(day)}
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${isToday
                    ? "bg-lime-900 text-white"
                    : isSelected
                      ? "text-lime-900 ring-1 ring-lime-300"
                      : "text-olive-700"
                    }`}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Malla horaria */}
        <div className="relative grid" style={{ gridTemplateColumns: gridColumns, height: totalHeight }}>
          <div className="relative">
            {hours.map((hour, index) => (
              <span
                key={hour}
                className={`absolute right-2 text-[11px] text-slate-400 ${index === 0 ? "translate-y-0" : "-translate-y-1/2"
                  }`}
                style={{ top: index * hourHeight + (index === 0 ? 2 : 0) }}
              >
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>

          {days.map((day) => {
            const isToday = isSameDay(day, now);
            const nowMinutes = minutesOfDay(now);
            const showNow = isToday && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

            const positioned = layoutDay(
              sessions.filter((session) => isSameDay(session.start, day)),
            );

            return (
              <div
                key={day.toISOString()}
                className={`relative border-l border-slate-100 ${multiDay && isSameDay(day, selectedDate) ? "bg-slate-50/60" : ""
                  }`}
              >
                {hours.slice(0, -1).map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{ top: index * hourHeight }}
                  />
                ))}

                {showNow && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: (nowMinutes - startHour * 60) * pxPerMinute }}
                  >
                    <span className="-ml-1 h-2 w-2 rounded-full bg-rose-400" />
                    <span className="h-px flex-1 bg-rose-400" />
                  </div>
                )}

                {positioned.map(({ session, lane, lanes }) => {
                  const startMin = Math.max(minutesOfDay(session.start), startHour * 60);
                  const endMin = Math.min(minutesOfDay(session.end), endHour * 60);
                  if (endMin <= startMin) return null;

                  const top = (startMin - startHour * 60) * pxPerMinute;
                  const height = Math.max((endMin - startMin) * pxPerMinute, 24);
                  const style = CATEGORY_STYLES[session.category];

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => onSelectSession?.(session)}
                      title={`${session.title} · ${formatTimeRange(session.start, session.end)}`}
                      className={`absolute z-[5] overflow-hidden rounded-lg border border-l-4 px-2 py-1 text-left shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${style.bg} ${style.text} ${style.border}`}
                      style={{
                        top,
                        height: height - 2,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      }}
                    >
                      <p className="truncate text-xs font-semibold leading-tight">{session.title}</p>
                      {height >= 44 && (
                        <p className="mt-0.5 truncate text-[11px] opacity-80">
                          {formatTimeRange(session.start, session.end)}
                        </p>
                      )}
                      {height >= 66 && (
                        <p className="mt-0.5 truncate text-[11px] opacity-80">
                          {MODALITY_STYLES[session.modality].label} · {session.location}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}