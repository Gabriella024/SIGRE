import { useState, useMemo } from 'react';
import type { FilaRegistro, EstadoValidacion, InfoOrientacion } from '../types/cargaMasiva';
import { asistentesService } from '../services/massOrientationService';

export function useAsistentesCarga() {
    const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [filasValidacion, setFilasValidacion] = useState<FilaRegistro[]>([]);
    const [infoOrientacion, setInfoOrientacion] = useState<InfoOrientacion | null>(null);
    const [filtroTab, setFiltroTab] = useState<EstadoValidacion | 'todas'>('todas');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSeleccionarArchivo = (file: File) => {
        setArchivo(file);
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