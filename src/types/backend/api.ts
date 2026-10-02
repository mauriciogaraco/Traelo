/** Envelope de respuesta del backend — igual en todos los módulos. */

export type ApiOk<T> = { data: T };

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiPaginated<T> = { data: T[]; meta: PaginationMeta };

export type ApiErrorBody = {
  error: string;
  code: string;
  details?: unknown;
};
