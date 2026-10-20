export type ProjectMutationResult =
  | { success: true; data: string; error: null; conflict: false }
  | { success: false; data: null; error: string; conflict: boolean };

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function mutationSuccess(data: string): ProjectMutationResult {
  return { success: true, data, error: null, conflict: false };
}

export function mutationFailure(error: string, conflict = false): ProjectMutationResult {
  return { success: false, data: null, error, conflict };
}
