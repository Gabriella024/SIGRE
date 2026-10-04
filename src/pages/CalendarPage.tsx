// import React, { useState } from 'react';
// import SessionCalendar from '@/components/calendar/SessionCalendar';
// import { Calendar, List } from 'lucide-react'

// export const CalendarPage: React.FC = () => {

//   const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
//       <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         {/* <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//             Agenda de Sesiones SIGRE
//           </h1>
//           <p className="text-sm text-gray-500 dark:text-gray-400">
//             Gestiona las orientaciones, talleres y pitches programados.
//           </p>
//         </div> */}

//         <div className="flex items-center gap-2">

//           <select
//             id="view-select"
//             value={viewMode}
//             onChange={(e) => setViewMode(e.target.value as 'list' | 'calendar')}
//             className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
//           >
//             <option value="calendar">📅 Calendario</option>
//             <option value="list">📋 Listado</option>
//           </select>
//         </div>
//       </header>

//       <main className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//         {viewMode === 'calendar' ? (
//           <SessionCalendar module='orientaciones' />
//         ) : (
//           <div className="p-8 text-center text-gray-500 dark:text-gray-400">
//             <List className="w-12 h-12 mx-auto mb-3 opacity-40" />
//             <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
//               Vista de Listado
//             </h3>
//             <p className="text-sm mt-1">
//               Aquí se mostrará la tabla con el listado detallado de sesiones.
//             </p>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default CalendarPage;