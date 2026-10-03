import React from 'react';
import SessionCalendar from '@/components/calendar/SessionCalendar';

export const CalendarPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agenda de Sesiones SIGRE
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona las orientaciones, talleres y pitches programados.
          </p>
        </div>
      </header>

      {/* Contenedor del Calendario */}
      <main className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <SessionCalendar module="orientaciones"/>
      </main>
    </div>
  );
};

export default CalendarPage;