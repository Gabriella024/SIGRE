import React from "react";
import { Calendar, List } from "lucide-react";

export type ViewMode = "list" | "calendar";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-block w-40">
        <select
          value={viewMode}
          onChange={(e) => onViewChange(e.target.value as ViewMode)}
          className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg px-3 py-2 pr-8 shadow-sm focus:outline-none   cursor-pointer transition-colors"
        >
          <option value="list">📋 Listado</option>
          <option value="calendar">📅 Calendario</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};