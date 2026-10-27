export interface Municipality {
  id: number;
  name: string;
  department: string;
  active: boolean;
}

export type CatalogStatus = "activo" | "inactivo";

export interface SenaCenter {
  id: string;
  regionalId: string;
  code: string | null;
  name: string;
  status: string | null;
  updatedAt: string | null;
}

export interface SystemScreen {
  id: string;
  moduleCode: string;
  moduleName: string;
  code: string;
  name: string;
  description: string | null;
  route: string | null;
  order: number | null;
  status: string | null;
  updatedAt: string | null;
}

export interface GuardarMunicipioInput {
  id: number | null;
  nombre: string;
  departamento: string;
}

export interface CambiarEstadoMunicipioInput {
  id: number;
  estaActivo: boolean;
}

export interface GuardarCentroSenaInput {
  id: string | null;
  updatedAt: string | null;
  idRegional: string;
  codigo: string;
  nombre: string;
}

export interface CambiarEstadoCentroSenaInput {
  id: string;
  updatedAt: string;
  estadoNuevo: CatalogStatus;
}

export interface ScreenChange {
  id: string;
  updatedAt: string;
  orden: number;
  estado: CatalogStatus;
}
