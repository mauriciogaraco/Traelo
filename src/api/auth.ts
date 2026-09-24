import { apiPost, apiPostNoContent } from './client';
import type { AuthSession, AuthTokens, ForgotPasswordResult } from '../types/backend/auth';

// Autenticación OPCIONAL de clientes (ver docs/BACKEND_API.md). Ninguna de estas llamadas
// lleva Bearer: se usan para obtener/renovar/cerrar la sesión, no dentro de ella.

export type RegisterInput = {
  name: string;
  phone: string;
  password: string;
  email?: string;
};

export function registerCustomer(input: RegisterInput) {
  return apiPost<AuthSession>('/auth/customer/register', input);
}

export function loginCustomer(input: { phone: string; password: string }) {
  return apiPost<AuthSession>('/auth/customer/login', input);
}

export function refreshCustomerSession(refreshToken: string) {
  return apiPost<AuthTokens>('/auth/customer/refresh', { refreshToken });
}

export function logoutCustomer(refreshToken: string) {
  return apiPostNoContent('/auth/customer/logout', { refreshToken });
}

export function requestPasswordReset(phone: string) {
  return apiPost<ForgotPasswordResult>('/auth/customer/forgot-password', { phone });
}

export function resetPassword(input: { token: string; newPassword: string }) {
  return apiPostNoContent('/auth/customer/reset-password', input);
}
