import { useMemo, useState } from "react";

import { InformesHeader } from "@/features/informes/components/ReportHeader";
import { ReportView } from "@/features/informes/components/ReportView";
import { ReportGrid } from "@/components/ui/report/ReportGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { useAvailableReports, useDataScope } from "@/features/informes/hooks/useInformes";
import { REPORT_CONFIGS } from "@/features/informes/utils/reportCatalog";
import type { ReportId } from "@/features/informes/types/types";

export default function InformesPage() {
  const { isLoading, error, refreshPermissions } = useAccessControl();
  const scope = useDataScope();
  const available = useAvailableReports(scope);
  const [selected, setSelected] = useState<ReportId | null>(null);
  const reports = useMemo(() => available.map((id) => REPORT_CONFIGS[id].definition), [available]);
  const active = selected && available.includes(selected) ? selected : null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-8">
      <InformesHeader />
      {isLoading ? (
        <LoadingState message="Verificando permisos..." />
      ) : error ? (
        <ErrorState message="No fue posible verificar tus permisos." detail={error} onRetry={() => void refreshPermissions()} />
      ) : !scope || reports.length === 0 ? (
        <EmptyState message="Tu rol no tiene informes disponibles." />
      ) : active ? (
        <ReportView id={active} scope={scope} onBack={() => setSelected(null)} />
      ) : (
        <ReportGrid reports={reports} onOpenReport={setSelected} />
      )}
    </section>
  );
}
