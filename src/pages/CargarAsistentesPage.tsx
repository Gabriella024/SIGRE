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
import { useAccessControl } from '@/features/access-control/hooks/useAccessControl';
import { SCREEN_CODES } from '@/features/access-control/constants/screens';
import { PendingIntegrationNotice } from '@/components/ui/pending-integration';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CargarAsistentesPage() {
  const {
    pasoActual,
    setPasoActual,
    archivo,
    filasValidacion,
    infoOrientacion,
    filtroTab,
    setFiltroTab,
    resumenCounts,
    isProcessing,
    handleSeleccionarArchivo,
    handleProcesarArchivo,
    handleConfirmar,
    handleReset,
  } = useAsistentesCarga();
  const { can } = useAccessControl();
  const canRegister = can('orientacion_masiva', 'crear', SCREEN_CODES.orientacion_masiva);

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
          <HeaderConfirmado fechaConfirmacion={infoOrientacion?.fechaCarga || '04/10/2026'} />
        )}

        <PendingIntegrationNotice title="Modo demostrativo">
          Puedes seleccionar un archivo desde tu equipo, pero su contenido todavía no se lee.
          La validación y el registro muestran datos de ejemplo y no guardan información en Supabase.
        </PendingIntegrationNotice>

        <Stepper currentStep={pasoActual} onSelectStep={(paso) => setPasoActual(paso)} />

        {pasoActual === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {!archivo ? (
                <Dropzone onSelectFile={handleSeleccionarArchivo} />
              ) : (
                <FilePreview
                  fileName={archivo.name}
                  fileSize={formatFileSize(archivo.size)}
                  onRemove={handleReset}
                />
              )}
              <TemplateDownloadCard />

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
                    disabled={isProcessing}
                    onClick={handleProcesarArchivo}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : 'Procesar (demostración)'}
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

            <ValidationSummaryCards
              filasTotales={filasValidacion.length}
              filtroActivo={filtroTab}
              onSeleccionarFiltro={(st) => setFiltroTab(st)}
              resumen={[
                { estado: 'valida', valor: resumenCounts.valida, etiqueta: 'Válidas para registrar' },
                { estado: 'error', valor: resumenCounts.error, etiqueta: 'Con errores en datos' },
                { estado: 'duplicada', valor: resumenCounts.duplicada, etiqueta: 'Duplicadas en archivo' },
                { estado: 'existente', valor: resumenCounts.existente, etiqueta: 'Ya registradas previamente' },
              ]}
            />

            <ValidationAlert erroresCount={resumenCounts.error + resumenCounts.duplicada} />

            <ValidationTable
              filas={filasValidacion}
              resumenCounts={resumenCounts}
              filtroActivo={filtroTab}
              onCambiarFiltro={(f) => setFiltroTab(f)}
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Volver a cargar
              </button>
              {canRegister ? (
                <button
                  type="button"
                  disabled={isProcessing || resumenCounts.valida === 0}
                  onClick={handleConfirmar}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                >
                  {isProcessing ? 'Confirmando...' : `Confirmar registro de demostración (${resumenCounts.valida})`}
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