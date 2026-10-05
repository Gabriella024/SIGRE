import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EstadoValidacion } from './ValidationSummaryCards';

export interface FilaRegistro {
  fila: number;
  doc: string;
  nombre: string;
  correo: string;
  estado: EstadoValidacion;
  mensaje: string;
}

interface ValidationTableProps {
  filas: FilaRegistro[];
  resumenCounts: Record<EstadoValidacion, number>;
  filtroActivo: EstadoValidacion | 'todas';
  onCambiarFiltro: (filtro: EstadoValidacion | 'todas') => void;
}

const BADGES: Record<EstadoValidacion, { label: string; className: string; msgClass: string }> = {
  valida: {
    label: 'Válida',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    msgClass: 'text-emerald-700',
  },
  error: {
    label: 'Con error',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
    msgClass: 'text-rose-700 font-medium',
  },
  duplicada: {
    label: 'Duplicada',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    msgClass: 'text-amber-700',
  },
  existente: {
    label: 'Existente',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
    msgClass: 'text-sky-700',
  },
};

export function ValidationTable({
  filas,
  resumenCounts,
  filtroActivo,
  onCambiarFiltro,
}: ValidationTableProps) {
  const [busqueda, setBusqueda] = useState('');

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      const coincideEstado = filtroActivo === 'todas' || f.estado === filtroActivo;
      const term = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !term ||
        f.doc.toLowerCase().includes(term) ||
        f.nombre.toLowerCase().includes(term) ||
        f.correo.toLowerCase().includes(term);

      return coincideEstado && coincideBusqueda;
    });
  }, [filas, filtroActivo, busqueda]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => onCambiarFiltro('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${filtroActivo === 'todas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
          >
            Todas
          </button>

          {(['valida', 'error', 'duplicada', 'existente'] as EstadoValidacion[]).map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => onCambiarFiltro(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${filtroActivo === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
            >
              <span>{BADGES[st].label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filtroActivo === st ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {resumenCounts[st]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por documento o nombre"
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">N.º FILA</th>
              <th className="px-4 py-3">DOCUMENTO</th>
              <th className="px-4 py-3">NOMBRE COMPLETO</th>
              <th className="px-4 py-3">CORREO</th>
              <th className="px-4 py-3">ESTADO</th>
              <th className="px-4 py-3">MENSAJE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filasFiltradas.length > 0 ? (
              filasFiltradas.map((f) => {
                const badge = BADGES[f.estado];
                const esError = f.estado === 'error';

                return (
                  <tr
                    key={f.fila}
                    className={`hover:bg-slate-50/80 transition-colors ${esError ? 'bg-rose-50/30' : ''
                      }`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-400">{f.fila}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{f.doc}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{f.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{f.correo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${badge.msgClass}`}>{f.mensaje}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No se encontraron resultados que coincidan con la búsqueda o filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>Mostrando 1–{filasFiltradas.length} de {filasFiltradas.length} filas</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            className="p-1.5 rounded-md border border-slate-200 text-slate-300 disabled:opacity-50 cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-md bg-slate-900 text-white font-semibold flex items-center justify-center"
          >
            1
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}