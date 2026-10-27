import { useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FiltersBar, type FilterConfig } from "@/components/ui/filtersBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import MinimalTable from "@/components/ui/table/MinimalTable";
import type { Column } from "@/components/ui/table/types";
import { distinctOptions } from "@/lib/format";

import { useReportData, useReportExport, type ReportExportOutcome } from "../hooks/useInformes";
import { INITIAL_REPORT_FILTERS, filterReportRows, scopeDescription } from "../utils/informesUtils";
import { REPORT_CONFIGS } from "../utils/reportCatalog";

import type { DataScope, ReportConfig, ReportId, ReportRowMap } from "../types/types";

function ExportFeedback({ outcome }: { outcome: ReportExportOutcome }) {
  switch (outcome.status) {
    case "success":
      return (
        <FeedbackMessage
          type="success"
          message={`Se exportaron ${outcome.count} ${outcome.count === 1 ? "registro" : "registros"} a Excel.`}
        />
      );
    case "empty":
      return <FeedbackMessage type="info" message="No hay registros con los filtros actuales. No se generó ningún archivo." />;
    case "denied":
      return <FeedbackMessage type="error" message="No tienes autorización para exportar informes." />;
    case "error":
      return <FeedbackMessage type="error" message={`${outcome.message} No se generó ningún archivo.`} />;
  }
}

function toTableColumns<T extends { id: string }>(config: ReportConfig<T>, scope: DataScope): Column<T>[] {
  return config.columns(scope).map((column, index) => ({
    key: `col-${index}`,
    label: column.header.toUpperCase(),
    render: (row: T) => {
      const value = column.value(row);
      if (value === null || value === "") return <span className="text-slate-300">—</span>;
      return value instanceof Date ? value.toLocaleDateString("es-CO", { timeZone: "UTC" }) : value;
    },
  }));
}

interface ReportBodyProps<T extends { id: string }> {
  config: ReportConfig<T>;
  scope: DataScope;
  rows: T[];
  onReload: () => void;
}

function ReportBody<T extends { id: string }>({ config, scope, rows, onReload }: ReportBodyProps<T>) {
  const [filters, setFilters] = useState(INITIAL_REPORT_FILTERS);
  const exporter = useReportExport();
  const filtered = useMemo(() => filterReportRows(rows, filters, config), [rows, filters, config]);
  const columns = useMemo(() => toTableColumns(config, scope), [config, scope]);
  const estadoOptions = useMemo(() => distinctOptions(rows.map(config.estado)), [rows, config]);

  const filterConfig: FilterConfig[] = [
    {
      key: "estado",
      label: config.estadoLabel,
      value: filters.estado,
      placeholder: "Todos los estados",
      options: estadoOptions,
      onChange: (estado) => setFilters((prev) => ({ ...prev, estado })),
    },
    {
      key: "desde",
      label: `${config.fechaLabel} desde`,
      type: "date",
      value: filters.desde,
      onChange: (desde) => setFilters((prev) => ({ ...prev, desde })),
    },
    {
      key: "hasta",
      label: `${config.fechaLabel} hasta`,
      type: "date",
      value: filters.hasta,
      onChange: (hasta) => setFilters((prev) => ({ ...prev, hasta })),
    },
  ];

  return (
    <div className="space-y-4">
      <FiltersBar
        searchTerm={filters.search}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        searchPlaceholder="Buscar en el informe..."
        filters={filterConfig}
        onClearFilters={() => setFilters((prev) => ({ ...INITIAL_REPORT_FILTERS, search: prev.search }))}
        actions={
          <>
            <Button variant="outline" onClick={onReload}>
              Actualizar
            </Button>
            {exporter.canExport && (
              <Button
                variant="outline"
                className="gap-2"
                disabled={exporter.isExporting}
                onClick={() => void exporter.exportar(config, scope, filtered)}
              >
                {exporter.isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporter.isExporting ? "Exportando…" : "Exportar a Excel"}
              </Button>
            )}
          </>
        }
      />

      {exporter.outcome && <ExportFeedback outcome={exporter.outcome} />}

      <p className="text-xs text-slate-500">
        {filtered.length} de {rows.length} registros obtenidos · {scopeDescription(scope)}
      </p>

      {filtered.length === 0 ? (
        <EmptyState message="No hay registros que coincidan con los filtros." />
      ) : (
        <MinimalTable<T> data={filtered} columns={columns} pageSize={10} selectable={false} />
      )}
    </div>
  );
}

function ReportContent<K extends ReportId>({ id, scope }: { id: K; scope: DataScope }) {
  const config: ReportConfig<ReportRowMap[K]> = REPORT_CONFIGS[id];
  const { data, error, isLoading, reload } = useReportData(id, scope, true);

  if (isLoading && !data) return <LoadingState message="Consultando registros del informe..." />;
  if (error) return <ErrorState message="No fue posible generar el informe." detail={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return <EmptyState message="No hay registros disponibles para tu usuario en este informe." />;
  }
  return <ReportBody config={config} scope={scope} rows={data} onReload={reload} />;
}

export function ReportView({ id, scope, onBack }: { id: ReportId; scope: DataScope; onBack: () => void }) {
  const { definition } = REPORT_CONFIGS[id];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="w-fit gap-2 px-2 text-slate-600" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Volver a informes
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{definition.title}</h2>
          <p className="text-sm text-slate-500">{definition.description}</p>
        </div>
      </div>
      <ReportContent key={id} id={id} scope={scope} />
    </section>
  );
}
