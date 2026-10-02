export type CalendarView = "day" | "week" | "month";

export type CalendarModule = "orientaciones" | "pitch";

export type SessionModality = "presencial" | "virtual";

export type MeetingPlatform = "Teams" | "Meet" | "Zoom";

export type OrientacionCategory = "reto" | "orientacion";

export type PitchCategory = "pitch" | "sustentacion";

export type SessionCategory = OrientacionCategory | PitchCategory;

export interface BaseSession {
  id: string;
  title: string;
  start: Date;
  end: Date;
  modality: SessionModality;
  location: string;
  platform?: MeetingPlatform;
  meetingUrl?: string;
  enrolled: number;
  capacity?: number;
}

export interface OrientacionSession extends BaseSession {
  module: "orientaciones";
  category: OrientacionCategory;
  orientador: string;
}

export interface PitchSession extends BaseSession {
  module: "pitch";
  category: PitchCategory;
  evaluador: string;
}

export type CalendarSession = OrientacionSession | PitchSession;