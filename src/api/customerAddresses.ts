import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { CustomerAddress } from '../types/backend/customer';
import type { DeliveryLocation } from '../types/backend/location';

// Todo lo de /customers/me exige sesión: el cliente sale del token, nunca de un id en la URL.
const AUTH = { auth: true } as const;

export type CreateAddressInput = {
  label: string;
  address: string;
  reference?: string;
  isDefault?: boolean;
  /** Pin opcional. En un PATCH: ausente = no tocar, null = quitarlo, objeto = fijarlo. */
  location?: DeliveryLocation | null;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

export function listCustomerAddresses() {
  return apiGet<CustomerAddress[]>('/customers/me/addresses', undefined, AUTH);
}

export function createCustomerAddress(input: CreateAddressInput) {
  return apiPost<CustomerAddress>('/customers/me/addresses', input, AUTH);
}

export function updateCustomerAddress(addressId: string, input: UpdateAddressInput) {
  return apiPatch<CustomerAddress>(`/customers/me/addresses/${addressId}`, input, AUTH);
}

export function deleteCustomerAddress(addressId: string) {
  return apiDelete(`/customers/me/addresses/${addressId}`, AUTH);
}
