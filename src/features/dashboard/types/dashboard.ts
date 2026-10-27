export interface MonthlyCount {
  mes: string;
  total: number;
}

export interface FunnelItem {
  etapa: string;
  valor: number;
}

export interface AttentionRow {
  id: string;
  proyecto: string | null;
  emprendedor: string | null;
  etapa: string;
  motivo: string;
  fecha: string | null;
  dias: number | null;
}
