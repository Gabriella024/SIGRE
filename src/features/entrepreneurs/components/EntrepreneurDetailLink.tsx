import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import type { Entrepreneur } from "../types/entrepreneur";

export function EntrepreneurDetailLink({ entrepreneur }: { entrepreneur: Pick<Entrepreneur, "id" | "nombre"> }) {
  return (
    <Button asChild variant="outline" size="sm" className="gap-1.5">
      <Link to={`/emprendedores/${encodeURIComponent(entrepreneur.id)}`} aria-label={`Ver ficha de ${entrepreneur.nombre}`}>
        <Eye className="h-4 w-4" aria-hidden="true" />
        Ver ficha
      </Link>
    </Button>
  );
}
