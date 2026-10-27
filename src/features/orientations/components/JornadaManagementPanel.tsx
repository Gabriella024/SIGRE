import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CatalogSelect, CatalogStatus } from "@/features/entrepreneurs/components/EntrepreneurProfileFields";

import { useJornadaMutation } from "../hooks/useJornadaMutation";
import { useOrientadores } from "../hooks/useOrientadores";
import { asignarOrientadorJornada, cerrarJornada } from "../services/orientationsService";
import { getClosureBlocker, nowInJornadaTimeZone } from "../utils/orientationUtils";

import type { OrientacionDetalle } from "../types/orientations";

interface ActionProps {
  jornada: OrientacionDetalle;
  onChanged: (message: string) => void;
}

function ActionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
      {message}
    </p>
  );
}

function AssignOrientadorForm({ jornada, onChanged }: ActionProps) {
  const orientadores = useOrientadores();
  const [selected, setSelected] = useState(jornada.idOrientador ?? "");
  const done = useCallback(() => onChanged("El orientador de la jornada se actualizó correctamente."), [onChanged]);
  const mutation = useJornadaMutation(asignarOrientadorJornada, done);

  const options = useMemo(() => orientadores.data ?? [], [orientadores.data]);
  const currentListed = jornada.idOrientador === null || options.some((item) => item.id === jornada.idOrientador);
  const unchanged = selected === (jornada.idOrientador ?? "");
  const validSelection = selected === "" || options.some((item) => item.id === selected);

  const submit = () => {
    if (unchanged || !validSelection) return;
    void mutation.run(jornada.id, selected === "" ? null : selected);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="jornada-orientador">Orientador responsable</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <CatalogSelect
          id="jornada-orientador"
          query={orientadores}
          isEmpty={options.length === 0}
          placeholders={{
            loading: "Cargando orientadores...",
            failed: "No fue posible cargar los orientadores",
            empty: "No hay orientadores activos",
            ready: "Sin asignar",
          }}
          value={selected}
          disabled={mutation.isSubmitting}
          onChange={(event) => {
            setSelected(event.target.value);
            mutation.reset();
          }}
        >
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.correo ? `${item.nombre} · ${item.correo}` : item.nombre}
            </option>
          ))}
        </CatalogSelect>
        <Button
          type="button"
          size="sm"
          className="gap-2 bg-lime-500 hover:bg-lime-600"
          disabled={mutation.isSubmitting || unchanged || !validSelection}
          onClick={submit}
        >
          {mutation.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isSubmitting ? "Guardando..." : "Asignar"}
        </Button>
      </div>
      <CatalogStatus
        query={orientadores}
        loadingMessage="Cargando orientadores..."
        isEmpty={options.length === 0}
        empty={<p className="text-xs text-slate-500">No hay usuarios activos con rol orientador.</p>}
        description={
          currentListed
            ? "Solo se listan usuarios activos con rol orientador."
            : "El orientador actual ya no está activo o no tiene el rol orientador. Selecciona otro."
        }
      />
      <ActionError message={mutation.error} />
    </div>
  );
}

function CloseJornadaAction({ jornada, onChanged }: ActionProps) {
  const [confirming, setConfirming] = useState(false);
  const done = useCallback(() => onChanged("La jornada quedó cerrada (finalizada)."), [onChanged]);
  const mutation = useJornadaMutation(cerrarJornada, done);
  const blocker = getClosureBlocker(jornada, nowInJornadaTimeZone());

  const confirm = () => {
    const current = getClosureBlocker(jornada, nowInJornadaTimeZone());
    if (current) return;
    void mutation.run(jornada.id);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">Cierre de la jornada</p>
      {blocker ? (
        <p className="text-xs text-slate-500">{blocker}</p>
      ) : confirming ? (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            La jornada pasará a estado <strong>finalizada</strong> y dejará de recibir inscripciones. Los inscritos sin
            asistencia registrada quedarán como “Sin registrar”.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={mutation.isSubmitting} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" className="gap-2" disabled={mutation.isSubmitting} onClick={confirm}>
              {mutation.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar cierre
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            mutation.reset();
            setConfirming(true);
          }}
        >
          Cerrar jornada
        </Button>
      )}
      <ActionError message={mutation.error} />
    </div>
  );
}

export function JornadaManagementPanel({
  jornada,
  canAssign,
  canClose,
  onChanged,
}: ActionProps & { canAssign: boolean; canClose: boolean }) {
  if (!canAssign && !canClose) return null;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      {canAssign && <AssignOrientadorForm key={jornada.idOrientador ?? "none"} jornada={jornada} onChanged={onChanged} />}
      {canClose && <CloseJornadaAction key={jornada.estado} jornada={jornada} onChanged={onChanged} />}
    </div>
  );
}
