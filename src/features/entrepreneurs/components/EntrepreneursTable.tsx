import MinimalTable from "@/components/ui/table/MinimalTable";
import type { TableSort } from "@/components/ui/table/types";
import type { Entrepreneur, EntrepreneurSort } from "@/features/entrepreneurs/types/entrepreneur";
import { ENTREPRENEUR_COLUMNS } from "@/features/entrepreneurs/columns";
import { isEntrepreneurSortKey } from "@/features/entrepreneurs/utils/entrepreneurUtils";

export interface EntrepreneurTableProps {
  rows: Entrepreneur[];
  sort: EntrepreneurSort;
  onSortChange: (sort: EntrepreneurSort) => void;
}

export function EntrepreneursTable({ rows, sort, onSortChange }: EntrepreneurTableProps) {
  const handleSortChange = ({ key, dir }: TableSort) => {
    if (isEntrepreneurSortKey(key)) onSortChange({ key, dir });
  };

  return (
    <MinimalTable<Entrepreneur>
      data={rows}
      columns={ENTREPRENEUR_COLUMNS}
      sort={sort}
      onSortChange={handleSortChange}
      paginated={false}
      selectable={false}
    />
  );
}
