/** DTOs de /api/v1/customers — ver docs/BACKEND_API.md §5. */

import type { DeliveryLocation } from './location';

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  /** Hoy siempre false: no hay verificación por SMS/email todavía. */
  phoneVerified: boolean;
  emailVerified: boolean;
  /** Saldo de puntos de fidelización (entero). */
  pointsBalance: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Dirección guardada EN EL TELÉFONO (libreta local, sin cuenta ni backend). `CustomerAddress` (la
 * que devolvía el servidor) cabe aquí, así que se puede importar tal cual.
 */
export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  reference: string | null;
  isDefault: boolean;
  /** Pin opcional de la dirección; null si la persona no lo añadió (lo normal). */
  location: DeliveryLocation | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddress = {
  id: string;
  customerId: string;
  label: string;
  address: string;
  reference: string | null;
  isDefault: boolean;
  /** Pin opcional de la dirección; null si la persona no lo añadió (lo normal). */
  location: DeliveryLocation | null;
  createdAt: string;
  updatedAt: string;
};

export type DevicePlatform = 'ANDROID' | 'IOS';

export type CustomerDevice = {
  id: string;
  customerId: string;
  platform: DevicePlatform;
  pushToken: string | null;
  appVersion: string | null;
  active: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FavoriteBusiness = {
  businessId: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type FavoriteProduct = {
  productId: string;
  businessId: string;
  name: string;
  price: number | null;
  createdAt: string;
};
