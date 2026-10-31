import { useCallback, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useAccessControl } from '@/features/access-control/hooks/useAccessControl';
import { SCREEN_CODES } from '@/features/access-control/constants/screens';
import { useOrientationAccess } from '@/features/orientations/hooks/useOrientationAccess';
import { useOrientations } from '@/features/orientations/hooks/useOrientations';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { formatDateOnly, formatTime, normalizeText } from '@/lib/format';

import { registrarCargaAsistentes, validarArchivoAsistentes } from '../services/massOrientationService';
import { aplicarResultadoCarga, contarPorEstado, EstructuraArchivoError, filasRechazadas } from '../utils/orientacionMasivaUtils';

import type { Orientacion } from '@/features/orientations/types/orientations';
import type { EstadoValidacion, FilaRegistro, InfoOrientacion, ResumenCarga } from '../types/cargaMasiva';

type Paso = 1 | 2 | 3;

function jornadaDetalle(jornada: Orientacion): string {
  return `${formatDateOnly(jornada.fecha)} · ${formatTime(jornada.horaInicio)}–${formatTime(jornada.horaFin)}`;
}

export function useAsistentesCarga() {
  const { user } = useAuth();
  const { can } = useAccessControl();
  const access = useOrientationAccess();
  const orientations = useOrientations();
  const canRegister = can('orientacion_masiva', 'crear', SCREEN_CODES.orientacion_masiva);

  const [pasoActual, setPasoActual] = useState<Paso>(1);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [orientacionId, setOrientacionId] = useState('');
  const [filasValidacion, setFilasValidacion] = useState<FilaRegistro[]>([]);
  const [infoOrientacion, setInfoOrientacion] = useState<InfoOrientacion | null>(null);
  const [filtroTab, setFiltroTab] = useState<EstadoValidacion | 'todas'>('todas');
  const [isProcessing, setIsProcessing] = useState(false);
  const [archivoError, setArchivoError] = useState<string | null>(null);
  const [resumenCarga, setResumenCarga] = useState<ResumenCarga | null>(null);

  const registro = useAdminMutation(registrarCargaAsistentes, {
    allowed: canRegister,
    deniedMessage: 'No tienes permiso para registrar asistentes.',
    fallbackMessage: 'No fue posible registrar la carga.',
    backend: { name: 'sigre_registrar_carga_asistentes', operation: 'Registrar carga masiva de asistentes' },
  });

  const { view, userId } = access;
  const jornadas = useMemo(
    () =>
      (orientations.data ?? [])
        .filter((row) => normalizeText(row.estado) !== 'cancelada')
        .filter((row) => view !== 'orientador' || (userId !== null && row.idOrientador === userId))
        .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
    [orientations.data, view, userId]
  );
  const jornada = jornadas.find((row) => row.id === orientacionId) ?? null;

  const handleSeleccionarArchivo = (file: File) => {
    setArchivo(file);
    setArchivoError(null);
  };

  const handleSeleccionarJornada = (id: string) => {
    setOrientacionId(id);
    setArchivoError(null);
  };

  const handleProcesarArchivo = async () => {
    if (!archivo || isProcessing) return;
    if (!jornada) {
      setArchivoError('Selecciona la jornada de orientación a la que pertenecen los asistentes.');
      return;
    }

    setIsProcessing(true);
    setArchivoError(null);
    try {
      const filas = await validarArchivoAsistentes(archivo);
      registro.reset();
      setFilasValidacion(filas);
      setFiltroTab('todas');
      setInfoOrientacion({
        orientacion: jornada.tema,
        detallesOrientacion: jornadaDetalle(jornada),
        archivoNombre: archivo.name,
        fechaCarga: new Date().toLocaleString('es-CO'),
        cargadoPor: user?.email ?? 'Usuario actual',
      });
      setPasoActual(2);
    } catch (error) {
      setArchivoError(
        error instanceof EstructuraArchivoError ? error.message : 'No fue posible procesar el archivo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmar = async () => {
    if (!jornada || !archivo) return;
    const asistentes = filasValidacion.flatMap((fila) => (fila.estado === 'valida' && fila.asistente ? [fila.asistente] : []));
    if (asistentes.length === 0) return;

    const result = await registro.run({
      orientacionId: jornada.id,
      nombreArchivo: archivo.name,
      asistentes,
      rechazados: filasRechazadas(filasValidacion),
    });
    if (!result.success) return;

    setFilasValidacion((filas) => aplicarResultadoCarga(filas, result.data));
    setResumenCarga(result.data.resumen);
    setPasoActual(3);
  };

  const resetRegistro = registro.reset;
  const handleReset = useCallback(() => {
    setPasoActual(1);
    setArchivo(null);
    setFilasValidacion([]);
    setInfoOrientacion(null);
    setFiltroTab('todas');
    setArchivoError(null);
    setResumenCarga(null);
    resetRegistro();
  }, [resetRegistro]);

  const handleVolverAPaso = (paso: Paso) => {
    if (paso < pasoActual && pasoActual !== 3) setPasoActual(paso);
  };

  const resumenCounts = useMemo(() => contarPorEstado(filasValidacion), [filasValidacion]);

  return {
    pasoActual,
    archivo,
    archivoError,
    jornadas,
    jornadasQuery: orientations,
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
  };
}
