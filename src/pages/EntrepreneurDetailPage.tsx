import { useState } from "react"
import { ArrowLeft, Pencil, Power, PowerOff, UserCog, UserPlus } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FeedbackMessage } from "@/components/ui/feedback-message"
import { PendingIntegrationNotice } from "@/components/ui/pending-integration"
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state"
import { SCREEN_CODES } from "@/features/access-control/constants/screens"
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl"
import { EntrepreneurAssignOrientadorModal } from "@/features/entrepreneurs/components/detail/EntrepreneurAssignOrientadorModal"
import { EntrepreneurDetailHeader } from "@/features/entrepreneurs/components/detail/EntrepreneurDetailHeader"
import {
  EntrepreneurGeneralSection,
  EntrepreneurTrainingSection,
} from "@/features/entrepreneurs/components/detail/EntrepreneurDetailSections"
import { EntrepreneurEditModal } from "@/features/entrepreneurs/components/detail/EntrepreneurEditModal"
import { EntrepreneurOrientationsSection } from "@/features/entrepreneurs/components/detail/EntrepreneurOrientationsSection"
import { EntrepreneurProjectsSection } from "@/features/entrepreneurs/components/detail/EntrepreneurProjectsSection"
import { EntrepreneurRoleEditModal } from "@/features/entrepreneurs/components/detail/EntrepreneurRoleEditModal"
import { EntrepreneurStatusModal } from "@/features/entrepreneurs/components/detail/EntrepreneurStatusModal"
import { useEntrepreneurAccess } from "@/features/entrepreneurs/hooks/useEntrepreneurAccess"
import { useEntrepreneurAssignment } from "@/features/entrepreneurs/hooks/useEntrepreneurAssignment"
import { useEntrepreneurDetail } from "@/features/entrepreneurs/hooks/useEntrepreneurDetail"
import { RESTORE_ENTREPRENEUR_LIST } from "@/features/entrepreneurs/hooks/useEntrepreneurListState"
import { useEntrepreneurStatusChange } from "@/features/entrepreneurs/hooks/useEntrepreneurStatusChange"
import { useEntrepreneurRoleEdit, type RoleEditSubmission } from "@/features/entrepreneurs/hooks/useEntrepreneurRoleEdit"
import { useEntrepreneurUpdate } from "@/features/entrepreneurs/hooks/useEntrepreneurUpdate"
import type { EntrepreneurEditFormValues } from "@/features/entrepreneurs/schemas/entrepreneursSchema"
import type {
  EntrepreneurAssignmentTarget,
  EntrepreneurEditTarget,
  EntrepreneurStatusTarget,
  OrientadorElegible,
} from "@/features/entrepreneurs/types/entrepreneur"
import {
  ENTREPRENEUR_UNAVAILABLE_MESSAGE,
  hasValidVersion,
  isInEntrepreneurScope,
  isInactiveEntrepreneur,
  normalizeSpaces,
  toEntrepreneurStatusTarget,
} from "@/features/entrepreneurs/utils/entrepreneurUtils"

type Notice = { id: string; message: string }

export function EntrepreneurDetailPage() {
  const { id } = useParams()
  const access = useEntrepreneurAccess()
  const detail = useEntrepreneurDetail(id ?? "")
  const { error, isLoading, reload } = detail
  const inScope = detail.entrepreneur !== null && access.scope !== null && isInEntrepreneurScope(access.scope, detail.entrepreneur)
  const entrepreneur = inScope ? detail.entrepreneur : null
  const isUnavailable = detail.isUnavailable || (detail.entrepreneur !== null && !inScope)
  const { can } = useAccessControl()
  const canViewProjects = can("proyectos", "ver", SCREEN_CODES.proyectos)
  const canViewOrientations = can("orientaciones", "ver", SCREEN_CODES.orientaciones)
  const updater = useEntrepreneurUpdate()
  const { guardar, reset: resetUpdater, isSubmitting: isSaving } = updater
  const [editingId, setEditingId] = useState<string | null>(null)
  const assignment = useEntrepreneurAssignment()
  const { asignar, reset: resetAssignment, isSubmitting: isAssigning } = assignment
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const statusChanger = useEntrepreneurStatusChange()
  const { cambiarEstado, reset: resetStatusChanger, isSubmitting: isChangingStatus } = statusChanger
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const hasVersion = entrepreneur !== null && hasValidVersion(entrepreneur.updatedAt)
  const isInactive = entrepreneur !== null && isInactiveEntrepreneur(entrepreneur)
  const statusTarget = entrepreneur ? toEntrepreneurStatusTarget(entrepreneur) : null
  const canEditEntrepreneur = updater.canEdit && hasVersion
  const roleEditor = useEntrepreneurRoleEdit(entrepreneur)
  const { guardar: guardarRol, reset: resetRoleEditor, isSubmitting: isSavingRole } = roleEditor
  const [roleEditingId, setRoleEditingId] = useState<string | null>(null)
  const canRoleEdit = !canEditEntrepreneur && roleEditor.canOpen && roleEditor.role !== null
  const canAssignOrientador = assignment.canAssign && hasVersion
  const canChangeStatus = statusChanger.canChangeStatus && hasVersion && statusTarget !== null
  const visibleNotice = notice && entrepreneur && notice.id === entrepreneur.id ? notice.message : null

  const openEdit = () => {
    resetUpdater()
    setNotice(null)
    setEditingId(entrepreneur?.id ?? null)
  }

  const closeEdit = () => {
    if (isSaving) return
    resetUpdater()
    setEditingId(null)
  }

  const reloadFromEdit = () => {
    closeEdit()
    reload()
  }

  const submitEdit = async (target: EntrepreneurEditTarget, values: EntrepreneurEditFormValues) => {
    const result = await guardar(target, values)
    if (!result.success) return result
    setEditingId(null)
    resetUpdater()
    reload()
    setNotice({
      id: target.id,
      message: `Los cambios del emprendedor "${normalizeSpaces(values.nombre_completo)}" se guardaron correctamente.`,
    })
    return result
  }

  const openAssign = () => {
    resetAssignment()
    setNotice(null)
    setAssigningId(entrepreneur?.id ?? null)
  }

  const closeAssign = () => {
    if (isAssigning) return
    resetAssignment()
    setAssigningId(null)
  }

  const reloadFromAssign = () => {
    closeAssign()
    reload()
  }

  const submitAssign = async (target: EntrepreneurAssignmentTarget, orientador: OrientadorElegible | null) => {
    const result = await asignar(target, orientador?.id ?? null)
    if (!result.success) return result
    setAssigningId(null)
    resetAssignment()
    reload()
    const nombre = entrepreneur ? `"${entrepreneur.nombre}"` : ""
    setNotice({
      id: target.id,
      message: !orientador
        ? `Se quitó el orientador del emprendedor ${nombre}.`
        : target.orientadorId
          ? `Se cambió el orientador del emprendedor ${nombre} a ${orientador.nombre}.`
          : `Se asignó a ${orientador.nombre} como orientador del emprendedor ${nombre}.`,
    })
    return result
  }

  const openStatusChange = () => {
    resetStatusChanger()
    setNotice(null)
    setStatusChangingId(entrepreneur?.id ?? null)
  }

  const closeStatusChange = () => {
    if (isChangingStatus) return
    resetStatusChanger()
    setStatusChangingId(null)
  }

  const openRoleEdit = () => {
    resetRoleEditor()
    setNotice(null)
    setRoleEditingId(entrepreneur?.id ?? null)
  }

  const closeRoleEdit = () => {
    if (isSavingRole) return
    resetRoleEditor()
    setRoleEditingId(null)
  }

  const reloadFromRoleEdit = () => {
    closeRoleEdit()
    reload()
  }

  const submitRoleEdit = async (submission: RoleEditSubmission) => {
    const result = await guardarRol(submission)
    if (!result.success) return result
    setRoleEditingId(null)
    resetRoleEditor()
    reload()
    if (entrepreneur) setNotice({ id: entrepreneur.id, message: "Los cambios se guardaron correctamente." })
    return result
  }

  const reloadFromStatusChange = () => {
    closeStatusChange()
    reload()
  }

  const submitStatusChange = async (target: EntrepreneurStatusTarget, justificacion: string) => {
    const result = await cambiarEstado(target, justificacion)
    if (!result.success) return result
    setStatusChangingId(null)
    resetStatusChanger()
    reload()
    const nombre = entrepreneur ? `"${entrepreneur.nombre}"` : ""
    setNotice({
      id: target.id,
      message:
        target.estadoNuevo === "inactivo"
          ? `El emprendedor ${nombre} se desactivó correctamente.`
          : `El emprendedor ${nombre} se activó correctamente.`,
    })
    return result
  }

  return (
    <div className="space-y-4 p-4 sm:p-6" aria-busy={isLoading}>
      {access.view !== "emprendedor" && (
        <Button asChild variant="outline" className="gap-2">
          <Link to="/emprendedores" state={RESTORE_ENTREPRENEUR_LIST}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a {access.label}
          </Link>
        </Button>
      )}

      {visibleNotice && <FeedbackMessage type="success" message={visibleNotice} />}

      {isLoading ? (
        <LoadingState message="Cargando ficha del emprendedor..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar la ficha del emprendedor." detail={error} onRetry={reload} />
      ) : isUnavailable || !entrepreneur ? (
        <EmptyState message={ENTREPRENEUR_UNAVAILABLE_MESSAGE} />
      ) : (
        <article className="space-y-4">
          <EntrepreneurDetailHeader
            entrepreneur={entrepreneur}
            actions={
              (canEditEntrepreneur || canAssignOrientador || canChangeStatus || canRoleEdit) && (
                <>
                  {canRoleEdit && (
                    <Button type="button" variant="outline" className="gap-2" onClick={openRoleEdit}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {roleEditor.role === "emprendedor" ? "Editar mi ficha" : "Editar datos"}
                    </Button>
                  )}
                  {canEditEntrepreneur && (
                    <Button type="button" variant="outline" className="gap-2" onClick={openEdit}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Editar
                    </Button>
                  )}
                  {canAssignOrientador && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={openAssign}
                      disabled={isInactive}
                      title={isInactive ? "Activa el emprendedor para asignar orientador." : undefined}
                    >
                      {entrepreneur.orientadorId ? (
                        <UserCog className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                      )}
                      {entrepreneur.orientadorId ? "Cambiar orientador" : "Asignar orientador"}
                    </Button>
                  )}
                  {canChangeStatus && statusTarget && (
                    <Button
                      type="button"
                      variant="outline"
                      className={`gap-2 ${
                        statusTarget.estadoNuevo === "inactivo"
                          ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                      onClick={openStatusChange}
                      disabled={isChangingStatus}
                      aria-busy={isChangingStatus}
                    >
                      {statusTarget.estadoNuevo === "inactivo" ? (
                        <PowerOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Power className="h-4 w-4" aria-hidden="true" />
                      )}
                      {statusTarget.estadoNuevo === "inactivo" ? "Desactivar" : "Activar"}
                    </Button>
                  )}
                </>
              )
            }
          />
          {isInactive && (
            <PendingIntegrationNotice title="Emprendedor inactivo">
              Mientras esté inactivo no se le puede asignar o cambiar orientador ni asociar nuevos proyectos.
              {canChangeStatus && " Actívalo para habilitar estas acciones."}
            </PendingIntegrationNotice>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EntrepreneurGeneralSection entrepreneur={entrepreneur} />
            <EntrepreneurTrainingSection entrepreneur={entrepreneur} />
          </div>
          {canViewProjects && (
            <EntrepreneurProjectsSection key={entrepreneur.id} entrepreneur={entrepreneur} />
          )}
          {canViewOrientations && (
            <EntrepreneurOrientationsSection key={entrepreneur.id} entrepreneurId={entrepreneur.id} />
          )}
          {canEditEntrepreneur && (
            <EntrepreneurEditModal
              entrepreneur={entrepreneur}
              open={editingId === entrepreneur.id}
              submission={{
                isSubmitting: isSaving,
                error: updater.error,
                reason: updater.reason,
                conflict: updater.conflict,
                onSubmit: submitEdit,
              }}
              onClose={closeEdit}
              onReload={reloadFromEdit}
            />
          )}
          {canAssignOrientador && !isInactive && (
            <EntrepreneurAssignOrientadorModal
              entrepreneur={entrepreneur}
              open={assigningId === entrepreneur.id}
              submission={{
                isSubmitting: isAssigning,
                error: assignment.error,
                reason: assignment.reason,
                conflict: assignment.conflict,
                onSubmit: submitAssign,
              }}
              onClose={closeAssign}
              onReload={reloadFromAssign}
            />
          )}
          {canRoleEdit && roleEditor.role && (
            <EntrepreneurRoleEditModal
              entrepreneur={entrepreneur}
              role={roleEditor.role}
              open={roleEditingId === entrepreneur.id}
              state={{
                saveAvailable: roleEditor.saveAvailable,
                isSubmitting: isSavingRole,
                error: roleEditor.error,
                conflict: roleEditor.conflict,
                onSubmit: submitRoleEdit,
              }}
              onClose={closeRoleEdit}
              onReload={reloadFromRoleEdit}
            />
          )}
          {canChangeStatus && statusTarget && (
            <EntrepreneurStatusModal
              entrepreneur={entrepreneur}
              target={statusTarget}
              open={statusChangingId === entrepreneur.id}
              submission={{
                isSubmitting: isChangingStatus,
                error: statusChanger.error,
                reason: statusChanger.reason,
                conflict: statusChanger.conflict,
                onSubmit: submitStatusChange,
              }}
              onClose={closeStatusChange}
              onReload={reloadFromStatusChange}
            />
          )}
        </article>
      )}
    </div>
  )
}
