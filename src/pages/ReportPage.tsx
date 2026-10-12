import { InformesHeader } from "@/features/informes/components/ReportHeader";
import { ReportGrid } from "@/components/ui/report/ReportGrid";
import { REPORTS } from "@/features/informes/mocks/reportCatalog";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

export default function InformesPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-8">
      <InformesHeader />
      <PendingIntegrationNotice className="mb-6">
        Los informes estarán disponibles cuando se integren sus consultas con Supabase.
      </PendingIntegrationNotice>
      <ReportGrid reports={REPORTS} />
    </section>
  );
}