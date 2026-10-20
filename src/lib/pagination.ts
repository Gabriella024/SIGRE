export const DEFAULT_PAGE_SIZE = 1000;

const MAX_PAGES = 500;

export interface PageResult<T> {
  rows: T[];
  total: number | null;
}

export class IncompleteFetchError extends Error {}

export async function fetchAllPages<T extends { id: string }>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  const byId = new Map<string, T>();
  let expected: number | null = null;
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { rows, total } = await fetchPage(offset, offset + pageSize - 1);

    if (total === null) throw new IncompleteFetchError("No fue posible determinar el total de registros.");
    if (expected === null) expected = total;
    if (total !== expected) {
      throw new IncompleteFetchError("Los registros cambiaron durante la consulta. Inténtalo nuevamente.");
    }

    for (const row of rows) {
      if (!byId.has(row.id)) byId.set(row.id, row);
    }

    offset += rows.length;

    if (offset >= expected) {
      if (byId.size !== expected) {
        throw new IncompleteFetchError("Los registros cambiaron durante la consulta. Inténtalo nuevamente.");
      }
      return Array.from(byId.values());
    }

    if (rows.length === 0) {
      throw new IncompleteFetchError("La consulta terminó antes de recuperar todos los registros.");
    }
  }

  throw new IncompleteFetchError("La consulta superó el número máximo de páginas permitido.");
}

export async function fetchAllPagesWithRetry<T extends { id: string }>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
  pageSize = DEFAULT_PAGE_SIZE,
  retries = 1
): Promise<T[]> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetchAllPages(fetchPage, pageSize);
    } catch (error) {
      if (!(error instanceof IncompleteFetchError) || attempt >= retries) throw error;
    }
  }
}
