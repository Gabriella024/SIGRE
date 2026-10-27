import { EntrepreneurCard } from "./EntrepreneurCard";

import type { Entrepreneur } from "../types/entrepreneur";

export function EntrepreneursCards({ rows }: { rows: readonly Entrepreneur[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {rows.map((row) => (
        <li key={row.id} className="flex min-w-0">
          <EntrepreneurCard entrepreneur={row} />
        </li>
      ))}
    </ul>
  );
}
