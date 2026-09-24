import { apiGet, apiPatch } from './client';
import type { Customer } from '../types/backend/customer';

// El alta de cuentas vive en api/auth.ts (registerCustomer): POST /customers ya no existe.

export type UpdateCustomerInput = {
  name?: string;
  email?: string;
};

export function getMyProfile() {
  return apiGet<Customer>('/customers/me', undefined, { auth: true });
}

export function updateMyProfile(input: UpdateCustomerInput) {
  return apiPatch<Customer>('/customers/me', input, { auth: true });
}
