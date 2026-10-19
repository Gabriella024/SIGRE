import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useOrientations } from "@/features/orientations/hooks/useOrientations";
import { useOrientationEditor } from "@/features/orientations/hooks/useOrientationEditor";
import { useOrientationAccess } from "@/features/orientations/hooks/useOrientationAccess";
import { JornadaFormModal } from "@/features/orientations/components/JornadaFormModal";
import { JornadaDetailModal } from "@/features/orientations/components/JornadaDetailModal";
import { AttendanceModal } from "@/features/orientations/components/AttendanceModal";
import { EnrollmentModal } from "@/features/orientations/components/EnrollmentModal";
import { AdminOrientationsView } from "@/features/orientations/views/AdminOrientationsView";
import { CoordinatorOrientationsView } from "@/features/orientations/views/CoordinatorOrientationsView";
import { OrientadorOrientationsView } from "@/features/orientations/views/OrientadorOrientationsView";
import { EmprendedorOrientationsView } from "@/features/orientations/views/EmprendedorOrientationsView";
import { ReadOnlyBadge } from "@/components/ui/pending-integration";
import type { Orientacion } from "@/features/orientations/types/orientations";

const NOTICE_TIMEOUT_MS = 4000;

const TITLES = {
  administrador: "Gestión de jornadas de orientación",
  coordinador: "Supervisión de orientaciones",
  orientador: "Mis jornadas de orientación",
  emprendedor: "Orientaciones",
} as const;

export function OrientationPage() {
  const { data, error, isLoading, reload, refreshOrientations } = useOrientations();
  const access = useOrientationAccess();
  const [notice, setNotice] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [attendanceJornada, setAttendanceJornada] = useState<Orientacion | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<{ jornadaId: string | null } | null>(null);
  const [enrollmentVersion, setEnrollmentVersion] = useState(0);

  const handleSaved = useCallback(
    (message: string) => {
      setNotice(message);
      refreshOrientations();
    },
    [refreshOrientations]
  );

  const editor = useOrientationEditor({
    canCreate: access.createJornada,
    canEdit: access.editJornada,
    onSaved: handleSaved,
  });

  const openDetail = useCallback((row: Orientacion) => setDetailId(row.id), []);
  const openAttendance = useCallback((row: Orientacion) => setAttendanceJornada(row), []);
  const openEnrollment = useCallback(
    (row: Orientacion | null) => setEnrollTarget({ jornadaId: row?.id ?? null }),
    []
  );
  const handleEnrolled = useCallback(() => setEnrollmentVersion((version) => version + 1), []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const query = useMemo(
    () => ({ data: data ?? [], error, isLoading, reload }),
    [data, error, isLoading, reload]
  );

  const { enrollEntrepreneurs, canEnrollFor } = access;
  const enrollableJornadas = useMemo(
    () => (enrollEntrepreneurs ? query.data.filter(canEnrollFor) : []),
    [enrollEntrepreneurs, canEnrollFor, query.data]
  );

  if (!access.view) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Acceso restringido</h2>
        <p className="mt-2 text-slate-600">Tu rol no tiene acceso al módulo de Orientaciones.</p>
      </div>
    );
  }

  const readOnly = access.view === "coordinador";

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        {TITLES[access.view]}
        {readOnly && <ReadOnlyBadge />}
      </h1>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {access.view === "administrador" && (
        <AdminOrientationsView
          query={query}
          onCreate={access.createJornada ? editor.openCreate : undefined}
          onEdit={access.editJornada ? editor.openEdit : undefined}
          onDetail={openDetail}
          onAttendance={access.manageAttendance ? openAttendance : undefined}
          onEnroll={access.enrollEntrepreneurs ? openEnrollment : undefined}
        />
      )}
      {access.view === "coordinador" && <CoordinatorOrientationsView query={query} onDetail={openDetail} />}
      {access.view === "orientador" && (
        <OrientadorOrientationsView
          query={query}
          userId={access.userId}
          onDetail={openDetail}
          onAttendance={access.manageAttendance ? openAttendance : undefined}
          onEnroll={access.enrollEntrepreneurs ? openEnrollment : undefined}
        />
      )}
      {access.view === "emprendedor" && <EmprendedorOrientationsView query={query} />}

      {access.view !== "emprendedor" && (
        <JornadaDetailModal
          jornadaId={detailId}
          view={access.view}
          canManageAttendance={access.canManageAttendanceFor}
          refreshKey={enrollmentVersion}
          onClose={() => setDetailId(null)}
        />
      )}

      {access.manageAttendance && (
        <AttendanceModal
          jornada={attendanceJornada}
          canManage={attendanceJornada !== null && access.canManageAttendanceFor(attendanceJornada)}
          refreshKey={enrollmentVersion}
          onEnroll={
            attendanceJornada !== null && access.canEnrollFor(attendanceJornada) ? openEnrollment : undefined
          }
          onClose={() => setAttendanceJornada(null)}
        />
      )}

      {access.enrollEntrepreneurs && (
        <EnrollmentModal
          open={enrollTarget !== null}
          initialJornadaId={enrollTarget?.jornadaId ?? null}
          jornadas={enrollableJornadas}
          onEnrolled={handleEnrolled}
          onClose={() => setEnrollTarget(null)}
        />
      )}

      {(access.createJornada || access.editJornada) && (
        <JornadaFormModal
          open={editor.open}
          mode={editor.mode}
          recordKey={editor.id}
          initialValues={editor.initialValues}
          loading={editor.loading}
          loadError={editor.loadError}
          isSubmitting={editor.isSubmitting}
          submitError={editor.submitError}
          onSubmit={editor.submit}
          onClose={editor.close}
        />
      )}
    </div>
  );
}
