import { InformesHeader } from "@/components/report/ReportHeader";
import { ReportGrid } from "@/components/ui/report/ReportGrid";
import { REPORTS } from "@/features/informes/mocks/reportCatalog";
import type { ReportId } from "@/features/informes/types/types";


export default function InformesPage() {
  const handleOpenReport = (id: ReportId) => {
    console.log(`Navegando al informe: ${id}`);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-8">
      <InformesHeader />
      <ReportGrid reports={REPORTS} onOpenReport={handleOpenReport} />
    </section>
  );
}