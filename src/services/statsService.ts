import { getCatalogStats } from '../api/catalog';
import { useStatsStore } from '../store/statsStore';
import type { CatalogStats, CatalogStatsResponse } from '../types/backend/catalog';

/** No se vuelven a pedir las estadísticas antes de esto (el backend además las cachea 5 minutos). */
export const STATS_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let inFlight: Promise<boolean> | null = null;

export function indexCatalogStats(response: CatalogStatsResponse): CatalogStats {
  const businesses: CatalogStats['businesses'] = {};
  for (const { businessId, ...stats } of response.businesses) businesses[businessId] = stats;
  const products: CatalogStats['products'] = {};
  for (const { productId, ...stats } of response.products) products[productId] = stats;
  return {
    windowDays: response.windowDays,
    weekWindowDays: response.weekWindowDays,
    generatedAt: response.generatedAt,
    businesses,
    products,
  };
}

/**
 * Baja popularidad y calificaciones. Nunca lanza y no molesta: sin red o con error del servidor
 * se conserva lo último guardado. Devuelve true si hay datos frescos (o recientes) en el teléfono.
 */
export function refreshCatalogStats({ force = false }: { force?: boolean } = {}): Promise<boolean> {
  const { loadedAt } = useStatsStore.getState();
  if (!force && loadedAt !== null && Date.now() - loadedAt < STATS_REFRESH_INTERVAL_MS) {
    return Promise.resolve(true);
  }
  if (inFlight) return inFlight;

  inFlight = getCatalogStats()
    .then((response) => {
      useStatsStore.getState().setStats(indexCatalogStats(response));
      return true;
    })
    .catch(() => false)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
