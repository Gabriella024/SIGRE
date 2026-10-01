export type ProjectStage = "Retos" | "Orientación" | "Pitch" | "Registro";
export type ProjectStatus = "Activo" | "Finalizado" | "Inactivo";

export interface Project {
  id: string | number;
  nombre: string;
  emprendedor: string;
  municipio: string;
  sector: string;
  etapa: ProjectStage;
  fechaRegistro: string;
  estado: ProjectStatus;
}