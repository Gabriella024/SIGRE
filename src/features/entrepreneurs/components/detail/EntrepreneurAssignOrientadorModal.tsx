import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/ui/detail-section";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

import { CatalogSelect, CatalogStatus, RequiredLabel } from "../EntrepreneurProfileFields";
import { LinkedUserSummary } from "../LinkedUserSummary";
import { useOrientadoresElegibles } from "../../hooks/useOrientadoresElegibles";
import {
  orientadorAssignmentFormSchema,
  type OrientadorAssignmentFormValues,
} from "../../schemas/entrepreneursSchema";
import {
  orientadorLabel,
  shortReference,
  toEntrepreneurAssignmentTarget,
} from "../../utils/entrepreneurUtils";

import type {
  EntrepreneurAssignmentTarget,
  EntrepreneurDetail,
  EntrepreneurErrorReason,
  EntrepreneurUpdateResult,
  OrientadorElegible,
} from "../../types/entrepreneur";

export interface OrientadorAssignmentSubmission {
  isSubmitting: boolean;
  error: string | null;
  reason: EntrepreneurErrorReason;
  conflict: boolean;
  onSubmit: (
    target: EntrepreneurAssignmentTarget,
    orientador: OrientadorElegible | null
  ) => Promise<EntrepreneurUpdateResult>;
}

interface EntrepreneurAssignOrientadorModalProps {
  entrepreneur: EntrepreneurDetail;
  open: boolean;
  submission: OrientadorAssignmentSubmission;
  onClose: () => void;
  onReload: () => void;
}

type AssignmentStep = "select" | "confirm-change" | "confirm-remove";

function OrientadorSummary({ orientador }: { orientador: OrientadorElegible }) {
  return (
    <span className="block min-w-0">
      <span className="block break-words font-medium text-slate-800">{orientador.nombre}</span>
      <span className="block break-all text-xs text-slate-500">{orientador.correo}</span>
    </span>
  );
}

function EntrepreneurAssignOrientadorForm({
  entrepreneur,
  submission,
  onClose,
  onReload,
}: Omit<EntrepreneurAssignOrientadorModalProps, "open">) {
  const target = useMemo(() => toEntrepreneurAssignmentTarget(entrepreneur), [entrepreneur]);
  const form = useForm<OrientadorAssignmentFormValues>({
    resolver: zodResolver(orientadorAssignmentFormSchema),
    defaultValues: { id_orientador: "" },
    mode: "onChange",
  });
  const [step, setStep] = useState<AssignmentStep>("select");
  const orientadores = useOrientadoresElegibles();
  const list = useMemo(() => orientadores.data ?? [], [orientadores.data]);
  const { isSubmitting, error, reason, conflict, onSubmit } = submission;
  const needsReload = conflict || reason === "registro";

  useEffect(() => {
    if (!orientadores.data) return;
    const selectedId = form.getValues("id_orientador");
    if (selectedId && !orientadores.data.some((item) => item.id === selectedId)) {
      form.setValue("id_orientador", "", { shouldValidate: true });
    }
  }, [orientadores.data, form]);

  const currentId = target.orientadorId;
  const current = currentId ? list.find((item) => item.id === currentId) ?? null : null;
  const selectedId = useWatch({ control: form.control, name: "id_orientador" });
  const selected = list.find((item) => item.id === selectedId) ?? null;
  const isSameAsCurrent = selected !== null && selected.id === currentId;
  const blocked = isSubmitting || needsReload;
  const canContinue = form.formState.isValid && selected !== null && !isSameAsCurrent && !blocked;

  const historicalName = entrepreneur.orientador?.nombre ?? null;
  const currentFallback = historicalName
    ? `${historicalName} (no elegible actualmente)`
    : orientadores.isLoading
      ? "Consultando orientador asignado..."
      : `Orientador no disponible para selección (ref. ${shortReference(currentId ?? "")})`;

  const describeCurrent = () => (current ? orientadorLabel(current) : currentFallback);

  const save = async (orientador: OrientadorElegible | null) => {
    const result = await onSubmit(target, orientador);
    if (!result.success && result.reason === "orientador") {
      orientadores.reload();
      setStep("select");
    }
  };

  const continueFromSelect = () => {
    if (!canContinue || !selected) return;
    if (currentId) setStep("confirm-change");
    else void save(selected);
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(continueFromSelect)}
        className="space-y-4"
        aria-busy={isSubmitting}
      >
        <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <DetailField label="Emprendedor">{entrepreneur.nombre}</DetailField>
          <DetailField label="Orientador actual">
            {current ? (
              <OrientadorSummary orientador={current} />
            ) : (
              <LinkedUserSummary
                linkedId={currentId}
                usuario={entrepreneur.orientador}
                emptyLabel="Sin orientador asignado"
              />
            )}
          </DetailField>
        </dl>

        {step === "select" && (
          <fieldset disabled={blocked} className="space-y-4">
            <FormField
              control={form.control}
              name="id_orientador"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel required>{currentId ? "Nuevo orientador" : "Orientador"}</RequiredLabel>
                  <FormControl>
                    <CatalogSelect
                      query={orientadores}
                      isEmpty={list.length === 0}
                      placeholders={{
                        loading: "Cargando orientadores...",
                        failed: "No fue posible cargar los orientadores",
                        empty: "No hay orientadores disponibles",
                        ready: "Selecciona un orientador",
                      }}
                      {...field}
                    >
                      {list.map((item) => (
                        <option key={item.id} value={item.id} disabled={item.id === currentId}>
                          {orientadorLabel(item)}
                          {item.id === currentId ? " (actual)" : ""}
                        </option>
                      ))}
                    </CatalogSelect>
                  </FormControl>
                  <CatalogStatus
                    query={orientadores}
                    loadingMessage="Consultando orientadores elegibles..."
                    isEmpty={list.length === 0}
                    empty={
                      <PendingIntegrationNotice title="No hay orientadores disponibles">
                        Debe existir al menos una cuenta activa con rol Orientador activo.
                      </PendingIntegrationNotice>
                    }
                    description="Solo se muestran usuarios activos con rol Orientador activo."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {selected && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Orientador seleccionado
                </p>
                <OrientadorSummary orientador={selected} />
              </div>
            )}
          </fieldset>
        )}

        {step === "confirm-change" && selected && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Confirma el cambio de orientador
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide">Orientador anterior</dt>
                <dd className="break-words">{describeCurrent()}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide">Nuevo orientador</dt>
                <dd className="break-words">{orientadorLabel(selected)}</dd>
              </div>
            </dl>
            <p>
              La reasignación puede modificar qué orientador ve a este emprendedor y sus proyectos. Los proyectos,
              jornadas, inscripciones y asistencias registrados no se modifican.
            </p>
          </div>
        )}

        {step === "confirm-remove" && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Confirma que deseas quitar el orientador
            </p>
            <p className="break-words">
              Se retirará a <strong>{describeCurrent()}</strong> y el emprendedor quedará sin orientador asignado.
            </p>
            <p>
              Esto puede modificar qué orientador ve a este emprendedor y sus proyectos. Los proyectos, jornadas,
              inscripciones y asistencias registrados no se modifican.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            {needsReload && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReload}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Recargar ficha
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
          {step === "select" ? (
            <>
              {currentId && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 sm:mr-auto"
                  onClick={() => setStep("confirm-remove")}
                  disabled={blocked}
                >
                  Quitar orientador
                </Button>
              )}
              <Button type="button" variant="outline" className="sm:ml-auto" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={!canContinue}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : currentId ? "Continuar" : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="sm:ml-auto"
                onClick={() => setStep("select")}
                disabled={blocked}
              >
                Volver
              </Button>
              <Button
                type="button"
                className={`gap-2 ${step === "confirm-remove" ? "bg-rose-600 hover:bg-rose-700" : ""}`}
                disabled={blocked || (step === "confirm-change" && !canContinue)}
                onClick={() => void save(step === "confirm-remove" ? null : selected)}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? "Guardando..."
                  : step === "confirm-remove"
                    ? "Quitar orientador"
                    : "Confirmar cambio"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}

export function EntrepreneurAssignOrientadorModal({
  entrepreneur,
  open,
  submission,
  onClose,
  onReload,
}: EntrepreneurAssignOrientadorModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !submission.isSubmitting) onClose();
      }}
      title={entrepreneur.orientadorId ? "Cambiar orientador" : "Asignar orientador"}
      description="Selecciona el orientador responsable del emprendedor."
    >
      {open && (
        <EntrepreneurAssignOrientadorForm
          entrepreneur={entrepreneur}
          submission={submission}
          onClose={onClose}
          onReload={onReload}
        />
      )}
    </Modal>
  );
}
