import { useMemo, useState } from "react";
import CalendarHeader from "./CalendarHeader";
import MiniCalendarSidebar from "../components/MiniCalendarSideBar";
import MonthViewGrid from "..//components/views/MonthViewGrid";
import WeekViewGrid from "../components/views/WeekViewGrid";
import { addDays, addMonths, formatRangeTitle, getWeekDays, startOfDay } from "../utils/dateUtils";
import { buildMockOrientaciones, buildMockPitches } from "../mocks/calendarMocks";
import type { CalendarModule, CalendarSession, CalendarView } from "../types/calendar";

interface SessionCalendarProps {
  module: CalendarModule;
  sessions?: CalendarSession[];
  readOnly?: boolean;
  onCreate?: () => void;
  onExport?: () => void;
  onSelectSession?: (session: CalendarSession) => void;
}

export default function SessionCalendar({
  module,
  sessions,
  readOnly = false,
  onCreate,
  onExport,
  onSelectSession,
}: SessionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [view, setView] = useState<CalendarView>("week");

  const data = useMemo<CalendarSession[]>(() => {
    if (sessions) return sessions;
    return module === "orientaciones" ? buildMockOrientaciones() : buildMockPitches();
  }, [sessions, module]);

  const move = (direction: 1 | -1) => {
    setSelectedDate((current) => {
      if (view === "month") return addMonths(current, direction);
      return addDays(current, direction * (view === "week" ? 7 : 1));
    });
  };

  const handleSelectSession = (session: CalendarSession) => {
    setSelectedDate(startOfDay(session.start));
    onSelectSession?.(session);
  };

  const days = view === "day" ? [selectedDate] : getWeekDays(selectedDate);

  // const handleCreateAction = readOnly ? undefined : onCreate;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <MiniCalendarSidebar
        selectedDate={selectedDate}
        sessions={data}
        onSelectDate={(date) => setSelectedDate(startOfDay(date))}
      />

      <section className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <CalendarHeader
          title={formatRangeTitle(view, selectedDate)}
          view={view}
          module={module}
          onViewChange={setView}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
          onTomorrow={() => setSelectedDate(addDays(startOfDay(new Date()), 1))}
          onExport={onExport}
          onCreate={onCreate}
        />

        {view === "month" ? (
          <MonthViewGrid
            date={selectedDate}
            selectedDate={selectedDate}
            sessions={data}
            onSelectDate={(date) => {
              setSelectedDate(startOfDay(date));
              setView("day");
            }}
            onSelectSession={handleSelectSession}
          />
        ) : (
          <div className="max-h-[calc(100vh-12rem)] overflow-auto">
            <WeekViewGrid
              days={days}
              sessions={data}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(startOfDay(date))}
              onSelectSession={handleSelectSession}
            />
          </div>
        )}
      </section>
    </div>
  );
}