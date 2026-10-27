import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { z } from "zod";

import { isNetworkError, NETWORK_ERROR_MESSAGE, type DbError } from "@/features/entrepreneurs/utils/dbError";

export type MutationResult<T = string> =
  | { success: true; data: T; error: null; conflict: false }
  | { success: false; data: null; error: string; conflict: boolean };

export class AdminOperationError extends Error {
  readonly conflict: boolean;
  readonly missingBackend: boolean;

  constructor(message: string, options: { conflict?: boolean; missingBackend?: boolean } = {}) {
    super(message);
    this.conflict = options.conflict ?? false;
    this.missingBackend = options.missingBackend ?? false;
  }
}

export interface AdminErrorCopy {
  operation: string;
  denied: string;
  fallback: string;
  notFound?: string;
  invalid?: string;
  duplicate?: string;
  reference?: string;
}

export const CONFLICT_MESSAGE =
  "Otra persona modificó este registro después de que abriste el formulario. Recarga la información antes de volver a intentarlo.";

export function missingBackendMessage(operation: string): string {
  return `La operación "${operation}" aún no está habilitada en el servidor. No se guardó ningún cambio.`;
}

export function toAdminOperationError(error: DbError, copy: AdminErrorCopy): AdminOperationError {
  if (isNetworkError(error)) return new AdminOperationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new AdminOperationError(copy.denied);
    case "P0002":
      return new AdminOperationError(copy.notFound ?? copy.fallback, { conflict: true });
    case "40001":
      return new AdminOperationError(CONFLICT_MESSAGE, { conflict: true });
    case "22023":
    case "23514":
      return new AdminOperationError(copy.invalid ?? copy.fallback);
    case "23505":
      return new AdminOperationError(copy.duplicate ?? copy.fallback);
    case "23503":
      return new AdminOperationError(copy.reference ?? copy.fallback);
    case "PGRST202":
      return new AdminOperationError(missingBackendMessage(copy.operation), { missingBackend: true });
    default:
      return new AdminOperationError(copy.fallback);
  }
}

export function toQueryError(error: DbError, subject: string): AdminOperationError {
  if (isNetworkError(error)) return new AdminOperationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new AdminOperationError(`No tienes autorización para consultar ${subject}.`);
    case "PGRST202":
    case "PGRST205":
      return new AdminOperationError(`La consulta de ${subject} no está disponible en el servidor.`, {
        missingBackend: true,
      });
    default:
      return new AdminOperationError(`No fue posible consultar ${subject}.`);
  }
}

export async function toFunctionError(error: unknown, copy: AdminErrorCopy): Promise<AdminOperationError> {
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    return new AdminOperationError(NETWORK_ERROR_MESSAGE);
  }

  if (error instanceof FunctionsHttpError) {
    const response: unknown = error.context;
    const status = response instanceof Response ? response.status : 0;

    switch (status) {
      case 401:
      case 403:
        return new AdminOperationError(copy.denied);
      case 404:
        return new AdminOperationError(missingBackendMessage(copy.operation), { missingBackend: true });
      case 409:
        return new AdminOperationError(copy.duplicate ?? copy.fallback);
      case 400:
      case 422:
        return new AdminOperationError(copy.invalid ?? copy.fallback);
    }
  }

  return new AdminOperationError(copy.fallback);
}

export function parseOperationResult<T>(data: unknown, schema: z.ZodType<T>, operation: string): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new AdminOperationError(`La respuesta de "${operation}" no tiene el formato esperado.`);
  }

  return parsed.data;
}

const uuidResultSchema = z.guid();
const integerResultSchema = z.number().int();

export function parseOperationId(data: unknown, operation: string): string {
  return parseOperationResult(data, uuidResultSchema, operation);
}

export function parseOperationIntegerId(data: unknown, operation: string): number {
  return parseOperationResult(data, integerResultSchema, operation);
}
