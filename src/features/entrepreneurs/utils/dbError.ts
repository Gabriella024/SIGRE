export type DbError = { code?: string; message: string };

export const NETWORK_ERROR_MESSAGE =
  "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";

export function isNetworkError(error: DbError): boolean {
  return !error.code && /fetch|network/i.test(error.message);
}
