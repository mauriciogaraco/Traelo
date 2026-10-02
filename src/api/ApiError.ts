/**
 * Error tipado del API client — checklist §37: distinguir NETWORK_ERROR,
 * REQUEST_TIMEOUT, SERVER_ERROR de errores de negocio (código real del backend,
 * p.ej. CART_CHANGED, RECENT_ORDER_PENDING, PRODUCT_UNAVAILABLE).
 * `message` es siempre texto seguro para mostrar al usuario (nunca un stack trace).
 */
export class ApiError extends Error {
  code: string;
  details?: unknown;
  status?: number;

  constructor(code: string, message: string, details?: unknown, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }

  isNetworkError() {
    return this.code === 'NETWORK_ERROR';
  }

  isTimeout() {
    return this.code === 'REQUEST_TIMEOUT';
  }
}
