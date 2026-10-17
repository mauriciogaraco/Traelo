import { apiGet } from './client';
import type {
  CatalogBootstrap,
  CatalogBusiness,
  CatalogCategory,
  CatalogChangesResult,
  CatalogProduct,
  CatalogStatsResponse,
  CatalogVersion,
} from '../types/backend/catalog';

// El backend gratuito de Render se duerme tras un rato sin uso y su primer arranque tarda ~20-30 s: con
// el límite normal (15 s) la app decía "sin conexión" al abrirla en frío. La sincronización del catálogo
// espera más; el resto de llamadas conserva su límite (la app ya muestra el catálogo guardado mientras).
const COLD_START_TIMEOUT_MS = 45_000;

/** Localidad pública (`GET /catalog/cities`): `id` es el que se manda como `?cityId=`. */
export type CatalogCityDTO = { id: string; code: string; name: string; acceptingOrders: boolean };

export function getCatalogCities() {
  return apiGet<CatalogCityDTO[]>('/catalog/cities');
}

/** Filtro de ciudad en el servidor (solo /catalog/bootstrap y /catalog/businesses lo aceptan; ver INFORME §I). */
export type CatalogCityParams = { cityId?: string };

export function getCatalogBootstrap(city: CatalogCityParams = {}) {
  // includeUnavailable: también los AGOTADOS, para mostrarlos con su etiqueta (no se pueden agregar).
  return apiGet<CatalogBootstrap>('/catalog/bootstrap', { includeUnavailable: true, ...city }, { timeoutMs: COLD_START_TIMEOUT_MS });
}

export function getCatalogVersion() {
  return apiGet<CatalogVersion>('/catalog/version', undefined, { timeoutMs: COLD_START_TIMEOUT_MS });
}

export function getCatalogChanges(since: number, limit = 200) {
  return apiGet<CatalogChangesResult>('/catalog/changes', { since, limit }, { timeoutMs: COLD_START_TIMEOUT_MS });
}

export function getCatalogCategories() {
  return apiGet<CatalogCategory[]>('/catalog/categories');
}

export function getCatalogBusinesses(search?: string, city: CatalogCityParams = {}) {
  return apiGet<CatalogBusiness[]>('/catalog/businesses', { search, ...city });
}

export function getCatalogBusinessProducts(
  businessId: string,
  params?: { categoryId?: string; search?: string },
) {
  return apiGet<CatalogProduct[]>(`/catalog/businesses/${businessId}/products`, { includeUnavailable: true, ...params });
}

/** Popularidad reciente y calificación de negocios, para ordenar la búsqueda. */
export function getCatalogStats() {
  return apiGet<CatalogStatsResponse>('/catalog/stats');
}

/** "Ofertas destacadas" del Home — productos marcados a mano desde el dashboard. */
export function getFeaturedProducts() {
  return apiGet<CatalogProduct[]>('/catalog/featured-products');
}

/**
 * Promoción "primera mensajería gratis" (`GET /catalog/promotions/free-delivery`): contador público
 * (5 + pedidos completados de San Antonio, hasta 15), mensajerías gratis que quedan y el código del enlace.
 */
export type FreeDeliveryPromo = {
  active: boolean;
  exhausted: boolean;
  /** Solo viene con la promoción activa. */
  code: string | null;
  cityCode: string;
  counter: { current: number; max: number };
  remaining: number;
};

export function getFreeDeliveryPromo() {
  return apiGet<FreeDeliveryPromo>('/catalog/promotions/free-delivery');
}
