import { ReportCard } from "./ReportCard";
import type { ReportDefinition, ReportId } from "../../../features/informes/types/types";

interface ReportGridProps {
    reports: ReadonlyArray<ReportDefinition>;
    onOpenReport?: (id: ReportId) => void;
}

export function ReportGrid({ reports, onOpenReport }: ReportGridProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
                <ReportCard key={report.id} report={report} onOpen={onOpenReport} />
            ))}
        </div>
    );
}