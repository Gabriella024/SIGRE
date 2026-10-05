import { useState, useMemo } from 'react';
import type { FilaRegistro, EstadoValidacion, InfoOrientacion } from './types/cargaMasiva';
import { asistentesService } from './asistentesService';

export function useAsistentesCarga() {
    const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [rowsPreview, setRowsPreview] = useState<string[][]>([]);
    const [filasValidacion, setFilasValidacion] = useState<FilaRegistro[]>([]);
    const [infoOrientacion, setInfoOrientacion] = useState<InfoOrientacion | null>(null);
    const [filtroTab, setFiltroTab] = useState<EstadoValidacion | 'todas'>('todas');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSeleccionarArchivo = async (file: File) => {
        setArchivo(file);
        const preview = await asistentesService.obtenerVistaPrevia(file);
        setRowsPreview(preview);
    };

    const handleProcesarArchivo = async () => {
        if (!archivo) return;
        setIsProcessing(true);
        try {
            const result = await asistentesService.validarArchivo(archivo);
            setInfoOrientacion(result.info);
            setFilasValidacion(result.filas);
            setPasoActual(2);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmar = async () => {
        setIsProcessing(true);
        try {
            const validas = filasValidacion.filter((f) => f.estado === 'valida').map((f) => f.fila);
            await asistentesService.confirmarRegistro(validas);
            setPasoActual(3);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setPasoActual(1);
        setArchivo(null);
        setRowsPreview([]);
        setFilasValidacion([]);
        setInfoOrientacion(null);
        setFiltroTab('todas');
    };

    const resumenCounts = useMemo(() => {
        return {
            valida: filasValidacion.filter((f) => f.estado === 'valida').length,
            error: filasValidacion.filter((f) => f.estado === 'error').length,
            duplicada: filasValidacion.filter((f) => f.estado === 'duplicada').length,
            existente: filasValidacion.filter((f) => f.estado === 'existente').length,
        };
    }, [filasValidacion]);

    return {
        pasoActual,
        setPasoActual,
        archivo,
        rowsPreview,
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
    };
}