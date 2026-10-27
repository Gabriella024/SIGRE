import { TriangleAlert, UserCheck, UserX, Users } from "lucide-react";

import { MetricCard } from "@/components/ui/metric-card";

import type { EntrepreneurMetrics as Metrics } from "../types/entrepreneur";

export function EntrepreneurMetrics({ metrics }: { metrics: Metrics | null }) {
  const otrosHint =
    metrics && metrics.otros > 0
      ? `${metrics.otros} con otro estado o sin estado`
      : undefined;

  return (
    <section aria-label="Indicadores de emprendedores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Total de emprendedores" value={metrics?.total ?? null} icon={Users} tone="blue" hint={otrosHint} />
      <MetricCard title="Activos" value={metrics?.activos ?? null} icon={UserCheck} tone="green" />
      <MetricCard title="Inactivos" value={metrics?.inactivos ?? null} icon={UserX} tone="red" />
      <MetricCard
        title="Riesgo de deserción"
        value={null}
        icon={TriangleAlert}
        tone="amber"
        hint="Pendiente de definición"
      />
    </section>
  );
}
