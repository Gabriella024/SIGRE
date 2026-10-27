import React from "react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: ColumnAlign;
  render?: (item: T) => React.ReactNode;
}

export type SortDirection = "asc" | "desc";
export type ColumnAlign = "left" | "center" | "right";
export type RowId = string | number;

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: ColumnAlign;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface TableSort {
  key: string;
  dir: SortDirection;
}

export interface MinimalTableProps<T extends { id: RowId }> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelectionChange?: (selectedIds: RowId[]) => void;
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort) => void;
  paginated?: boolean;
  selectable?: boolean;
}

export type UserStatus = "Activo" | "Inactivo" | "Pendiente";
export type UserRole = "Admin" | "Coordinador" | "Aprendiz";
export type UserStage = "Lectiva" | "Productiva" | "Graduado";