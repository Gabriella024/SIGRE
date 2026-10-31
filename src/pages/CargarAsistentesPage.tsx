import { useState } from 'react';

import { Stepper } from '../features/orientation-mass/components/Stepper';
import { InfoOrientacionCard } from '../features/orientation-mass/components/InfoOrientacionCard';
import { TemplateDownloadCard } from '../features/orientation-mass/components/TemplateDownloadCard';

import { Dropzone } from '../features/orientation-mass/components/Dropzone';
import { FilePreview } from '../features/orientation-mass/components/FilePreview';
import { RecommendationPanel } from '../features/orientation-mass/components/RecommendationPanel';

import { ValidationSummaryCards } from '../features/orientation-mass/components/ValidationSummaryCards';
import { ValidationAlert } from '../features/orientation-mass/components/ValidationAlert';
import { ValidationTable } from '@/features/orientation-mass/components/ValidationTable';

import { HeaderConfirmado } from '../features/orientation-mass/components/HeaderConfirmado';
import { TablaResultadosReadOnly } from '../features/orientation-mass/components/TablaResultadosReadOnly';

import { useAsistentesCarga } from '@/features/orientation-mass/hooks/useOrientationUpload';
import { descargarPlantillaAsistentes } from '@/features/orientation-mass/services/massOrientationService';
import { CatalogSelect } from '@/features/entrepreneurs/components/EntrepreneurProfileFields';
import { MutationAlert } from '@/components/ui/mutation-alert';
import { Label } from '@/components/ui/label';
import { formatDateOnly, formatTime } from '@/lib/format';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CargarAsistentesPage() {
  const {
    pasoActual,
    archivo,
    archivoError,
    jornadas,
    jornadasQuery,
    orientacionId,
    filasValidacion,
    infoOrientacion,
    filtroTab,
    setFiltroTab,
    resumenCounts,
    resumenCarga,
    isProcessing,
    canRegister,
    registro,
    handleSeleccionarArchivo,
    handleSeleccionarJornada,
    handleProcesarArchivo,
    handleConfirmar,
    handleReset,
    handleVolverAPaso,
  } = useAsistentesCarga();
  const [plantillaError, setPlantillaError] = useState<string | null>(null);

  const descargarPlantilla = () => {
    setPlantillaError(null);
    descargarPlantillaAsistentes().catch(() => setPlantillaError('No fue posible generar la plantilla.'));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased pb-12">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {pasoActual !== 3 ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {pasoActual === 1 ? 'Cargar archivo de asistentes' : 'Resultado de validación'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {pasoActual === 1
                  ? 'Sube un Excel con los aprendices que asistieron a la orientación.'
                  : 'Revisa los registros encontrados antes de confirmar la carga.'}
              </p>
            </div>
          </div>
        ) : (
          <HeaderConfirmado fechaConfirmacion={infoOrientacion?.fechaCarga ?? ''} />
        )}

        <Stepper currentStep={pasoActual} onSelectStep={handleVolverAPaso} />

        {pasoActual === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
                <Label htmlFor="carga-jornada">Jornada de orientación</Label>
                <CatalogSelect
                  id="carga-jornada"
                  query={jornadasQuery}
                  isEmpty={jornadas.length === 0}
                  placeholders={{
                    loading: 'Cargando jornadas...',
                    failed: 'No fue posible cargar las jornadas',
                    empty: 'No hay jornadas disponibles',
                    ready: 'Selecciona la jornada',
                  }}
                  value={orientacionId}
                  disabled={isProcessing}
                  onChange={(event) => handleSeleccionarJornada(event.target.value)}
                >
                  {jornadas.map((row) => (
                    <option key={row.id} value={row.id}>
                      {`${row.tema} · ${formatDateOnly(row.fecha)} · ${formatTime(row.horaInicio)}`}
                    </option>
                  ))}
                </CatalogSelect>
                {jornadasQuery.isLoading ? (
                  <p className="text-xs text-slate-500">Cargando jornadas...</p>
                ) : jornadasQuery.error ? (
                  <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-rose-700">
                    <span>{jornadasQuery.error}</span>
                    <button type="button" onClick={jornadasQuery.reload} className="rounded border border-slate-300 px-2 py-0.5 text-xs">
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    {jornadas.length === 0
                      ? 'No tienes jornadas visibles para asociar asistentes.'
                      : 'Los asistentes del archivo se asociarán a esta jornada.'}
                  </p>
                )}
              </div>

              {!archivo ? (
                <Dropzone onSelectFile={handleSeleccionarArchivo} />
              ) : (
                <FilePreview
                  fileName={archivo.name}
                  fileSize={formatFileSize(archivo.size)}
                  onRemove={handleReset}
                />
              )}
              <TemplateDownloadCard onDownload={descargarPlantilla} />
              {plantillaError && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {plantillaError}
                </p>
              )}

              {archivoError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {archivoError}
                </p>
              )}

              {archivo && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing || orientacionId === ''}
                    onClick={() => void handleProcesarArchivo()}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                  >
                    {isProcessing ? 'Validando...' : 'Validar archivo'}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <RecommendationPanel />
            </div>
          </div>
        )}

        {pasoActual === 2 && infoOrientacion && (
          <div className="space-y-6">
            <InfoOrientacionCard {...infoOrientacion} />

            {resumenCarga && (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Registrados nuevos', resumenCarga.validas],
                  ['Existentes', resumenCarga.existentes],
                  ['Inscritos en la jornada', resumenCarga.inscritos],
                  ['Prospectos orientados', resumenCarga.prospectos],
                  ['Invitaciones en cola', resumenCarga.invitaciones],
                  ['Errores', resumenCarga.errores],
                  ['Duplicados', resumenCarga.duplicadas],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-xl border border-slate-200 bg-white p-3">
                    <dt className="text-xs text-slate-500">{etiqueta}</dt>
                    <dd className="text-lg font-semibold text-slate-900">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}

            <ValidationSummaryCards
              filasTotales={filasValidacion.length}
              filtroActivo={filtroTab}
              onSeleccionarFiltro={(st) => setFiltroTab(st)}
              resumen={[
                { estado: 'valida', valor: resumenCounts.valida, etiqueta: 'Válidas para registrar' },
                { estado: 'error', valor: resumenCounts.error, etiqueta: 'Con errores en datos' },
                { estado: 'duplicada', valor: resumenCounts.duplicada, etiqueta: 'Duplicadas en archivo' },
                { estado: 'existente', valor: resumenCounts.existente, etiqueta: 'Ya registradas (lo valida el servidor)' },
              ]}
            />

            <ValidationAlert erroresCount={resumenCounts.error + resumenCounts.duplicada} />

            <ValidationTable
              filas={filasValidacion}
              resumenCounts={resumenCounts}
              filtroActivo={filtroTab}
              onCambiarFiltro={(f) => setFiltroTab(f)}
            />

            {canRegister && <MutationAlert feedback={registro} />}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={registro.isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Volver a cargar
              </button>
              {canRegister ? (
                <button
                  type="button"
                  disabled={registro.isSubmitting || registro.pendingBackend !== null || resumenCounts.valida === 0}
                  onClick={() => void handleConfirmar()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                >
                  {registro.isSubmitting ? 'Registrando...' : `Confirmar registro (${resumenCounts.valida})`}
                </button>
              ) : (
                <p className="text-xs text-slate-500">
                  No tienes permiso para registrar asistentes.
                </p>
              )}
            </div>
          </div>
        )}

        {pasoActual === 3 && infoOrientacion && (
          <div className="space-y-6">
            <InfoOrientacionCard {...infoOrientacion} />

            {resumenCarga && (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Registrados nuevos', resumenCarga.validas],
                  ['Existentes', resumenCarga.existentes],
                  ['Inscritos en la jornada', resumenCarga.inscritos],
                  ['Prospectos orientados', resumenCarga.prospectos],
                  ['Invitaciones en cola', resumenCarga.invitaciones],
                  ['Errores', resumenCarga.errores],
                  ['Duplicados', resumenCarga.duplicadas],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-xl border border-slate-200 bg-white p-3">
                    <dt className="text-xs text-slate-500">{etiqueta}</dt>
                    <dd className="text-lg font-semibold text-slate-900">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}

            <TablaResultadosReadOnly filas={filasValidacion} resumenCounts={resumenCounts} />

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Finalizar o Cargar Nuevo Archivo
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
