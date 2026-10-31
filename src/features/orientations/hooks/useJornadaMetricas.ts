import { useEffect, useState } from "react";

import { getJornadaMetricas } from "../services/orientationsService";

import type { JornadaMetricas, Orientacion } from "../types/orientations";

type MetricasState = {
  rows: readonly Orientacion[] | null;
  data: Map<string, JornadaMetricas> | null;
};

export function useJornadaMetricas(rows: readonly Orientacion[]) {
  const [state, setState] = useState<MetricasState>({ rows: null, data: null });

  useEffect(() => {
    let active = true;

    getJornadaMetricas(rows.map((row) => row.id))
      .then((data) => {
        if (active) setState({ rows, data });
      })
      .catch(() => {
        if (active) setState({ rows, data: null });
      });

    return () => {
      active = false;
    };
  }, [rows]);

  return state.rows === rows ? state.data : null;
}
