import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
}

const navButtonClass =
  "rounded-md border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

export function PaginationBar({ page, totalPages, from, to, total, onPageChange }: PaginationBarProps) {
  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm italic text-slate-500">
        Mostrando {from} a {to} de {total} registros en total
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className={navButtonClass}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className={navButtonClass}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
