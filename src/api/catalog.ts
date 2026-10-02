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

export function getCatalogBootstrap() {
  // includeUnavailable: también los AGOTADOS, para mostrarlos con su etiqueta (no se pueden agregar).
  return apiGet<CatalogBootstrap>('/catalog/bootstrap', { includeUnavailable: true }, { timeoutMs: COLD_START_TIMEOUT_MS });
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

export function getCatalogBusinesses(search?: string) {
  return apiGet<CatalogBusiness[]>('/catalog/businesses', { search });
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
