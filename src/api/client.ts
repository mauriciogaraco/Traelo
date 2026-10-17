import { env } from '../config/env';
import type { ApiErrorBody, ApiOk, ApiPaginated, PaginationMeta } from '../types/backend/api';
import { ApiError } from './ApiError';

const DEFAULT_TIMEOUT_MS = 15000;

/** Códigos con los que el backend rechaza un access token que se puede renovar y reintentar. */
const REFRESHABLE_AUTH_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN']);

type Query = Record<string, string | number | boolean | undefined>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  timeoutMs?: number;
  /**
   * Adjunta `Authorization: Bearer` si hay sesión (el backend decide si la exige o solo la usa,
   * p.ej. /checkout la acepta opcional). Sin sesión, la petición sale igual, como invitado.
   */
  auth?: boolean;
  /** Cabeceras extra (p.ej. X-Guest-Token para seguir un pedido de invitado). */
  headers?: Record<string, string>;
  /** Permite cancelar la petición desde fuera (p.ej. el polling al salir de la pantalla). */
  signal?: AbortSignal;
  /** Deja que la petición termine aunque se cierre la pestaña (último envío de analítica). */
  keepalive?: boolean;
};

/**
 * Puente hacia la sesión (services/authService) sin que el cliente HTTP dependa de ella:
 * el cliente solo sabe pedir un token y pedir que se renueve.
 */
export type AuthHandler = {
  /** Access token vigente (renovándolo antes si está por vencer) o null si no hay sesión. */
  getAccessToken: () => Promise<string | null>;
  /**
   * Renueva la sesión y devuelve el access token nuevo, o null si la sesión ya no es
   * recuperable (refresh token vencido/revocado). Lanza ApiError si falla por red: en ese caso
   * la sesión sigue siendo válida y NO debe cerrarse.
   */
  refresh: (failedAccessToken?: string) => Promise<string | null>;
};

let authHandler: AuthHandler | null = null;

export function setAuthHandler(handler: AuthHandler | null): void {
  authHandler = handler;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${env.apiBaseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function safeParseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function performFetch(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<{ response: Response; json: unknown }> {
  const { method = 'GET', body, query, timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, keepalive } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': env.apiKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      keepalive,
    });
  } catch {
    // Cancelada por quien llamó: no es un fallo de red ni un timeout.
    if (signal?.aborted) {
      throw new ApiError('REQUEST_ABORTED', 'La solicitud fue cancelada.');
    }
    if (controller.signal.aborted) {
      throw new ApiError('REQUEST_TIMEOUT', 'La solicitud tardó demasiado. Verifica tu conexión.');
    }
    throw new ApiError('NETWORK_ERROR', 'No pudimos conectar con Tráelo. Verifica tu conexión.');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  return { response, json: await safeParseJson(response) };
}

/** Único punto de entrada HTTP de la app. No usar fetch directamente desde otro lado (checklist §4). */
async function request<TBody>(path: string, options: RequestOptions = {}): Promise<TBody> {
  const useAuth = options.auth === true && authHandler !== null;
  let accessToken = useAuth ? await authHandler!.getAccessToken() : null;

  let { response, json } = await performFetch(path, options, accessToken);

  // Access token vencido/inválido (p.ej. el reloj del teléfono, o vencido justo en vuelo): se
  // renueva UNA vez (en un solo vuelo, ver authService) y se reintenta la misma petición.
  if (useAuth && accessToken && response.status === 401) {
    const code = (json as ApiErrorBody | null)?.code;
    if (code && REFRESHABLE_AUTH_CODES.has(code)) {
      // Si la sesión ya no es recuperable (null) se reintenta SIN credencial: una ruta abierta
      // a invitados (checkout) sigue adelante como invitado; una que exige cuenta responde
      // 401 AUTH_REQUIRED y la app lo trata como "inicia sesión".
      accessToken = await authHandler!.refresh(accessToken);
      ({ response, json } = await performFetch(path, options, accessToken));
    }
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new ApiError(
        'SERVER_ERROR',
        'Tráelo tuvo un problema en el servidor. Inténtalo de nuevo en un momento.',
        json,
        response.status,
      );
    }
    const errorBody = json as ApiErrorBody | null;
    throw new ApiError(
      errorBody?.code ?? 'UNKNOWN_ERROR',
      errorBody?.error ?? 'Ocurrió un error inesperado.',
      errorBody?.details,
      response.status,
    );
  }

  return json as TBody;
}

type CallOptions = Pick<RequestOptions, 'auth' | 'headers' | 'timeoutMs' | 'signal' | 'keepalive'>;

export async function apiGet<T>(path: string, query?: Query, options?: CallOptions): Promise<T> {
  const json = await request<ApiOk<T>>(path, { ...options, method: 'GET', query });
  return json.data;
}

/** Respuesta { data: objeto, meta } (p.ej. /points: saldo + movimientos paginados). */
export async function apiGetWithMeta<T>(
  path: string,
  query?: Query,
  options?: CallOptions,
): Promise<{ data: T; meta: PaginationMeta }> {
  return request<{ data: T; meta: PaginationMeta }>(path, { ...options, method: 'GET', query });
}

export async function apiGetPaginated<T>(path: string, query?: Query, options?: CallOptions): Promise<ApiPaginated<T>> {
  return request<ApiPaginated<T>>(path, { ...options, method: 'GET', query });
}

export async function apiPost<T>(path: string, body?: unknown, options?: CallOptions): Promise<T> {
  const json = await request<ApiOk<T>>(path, { ...options, method: 'POST', body });
  return json.data;
}

export async function apiPatch<T>(path: string, body?: unknown, options?: CallOptions): Promise<T> {
  const json = await request<ApiOk<T>>(path, { ...options, method: 'PATCH', body });
  return json.data;
}

export async function apiDelete<T = void>(path: string, options?: CallOptions): Promise<T> {
  // El backend responde 204 (sin cuerpo) a los DELETE: json puede ser null.
  const json = await request<ApiOk<T> | null>(path, { ...options, method: 'DELETE' });
  return json?.data as T;
}

/** Como apiPost pero para respuestas 204 sin cuerpo (logout, reset-password). */
export async function apiPostNoContent(path: string, body?: unknown, options?: CallOptions): Promise<void> {
  await request<unknown>(path, { ...options, method: 'POST', body });
}
