import { apiGetWithMeta } from './client';
import type { CustomerPoints } from '../types/backend/points';

/** Saldo e historial de puntos de la cuenta (requiere sesión). */
export function getMyPoints(page = 1, pageSize = 50) {
  return apiGetWithMeta<CustomerPoints>('/customers/me/points', { page, pageSize }, { auth: true });
}
