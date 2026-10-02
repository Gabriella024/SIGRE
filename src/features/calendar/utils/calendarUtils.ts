import type { CalendarSession, SessionCategory, SessionModality } from "../types/calendar";

export const CATEGORY_STYLES: Record<SessionCategory, { bg: string; text: string; border: string; dot: string }> = {
  orientacion: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  pitch: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500'
  },
  reto: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500'
  },
  sustentacion: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
    dot: 'bg-purple-500'
  }
};

export const MODALITY_STYLES: Record<SessionModality, { label: string; bg: string; text: string }> = {
  presencial: {
    label: 'Presencial',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300'
  },
  virtual: {
    label: 'Virtual',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300'
  }
};

export const getResponsible = (session: CalendarSession): { role: string; name: string } => {
  const [role, name] = session.module === 'orientaciones'
    ? ['Orientador', session.orientador]
    : ['Evaluador', session.evaluador];
  return { role, name: name || 'Sin asignar' };
};