import { getFeaturedProducts } from '../api/catalog';
import { useFeaturedProductsStore } from '../store/featuredProductsStore';

/** No se vuelven a pedir antes de esto (mismo criterio que refreshCatalogStats). */
export const FEATURED_PRODUCTS_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let inFlight: Promise<boolean> | null = null;

/**
 * Baja "ofertas destacadas". Nunca lanza y no molesta: sin red o con error del servidor se
 * conserva lo último guardado. Devuelve true si hay datos frescos (o recientes) en el teléfono.
 */
export function refreshFeaturedProducts({ force = false }: { force?: boolean } = {}): Promise<boolean> {
  const { loadedAt } = useFeaturedProductsStore.getState();
  if (!force && loadedAt !== null && Date.now() - loadedAt < FEATURED_PRODUCTS_REFRESH_INTERVAL_MS) {
    return Promise.resolve(true);
  }
  if (inFlight) return inFlight;

  inFlight = getFeaturedProducts()
    .then((products) => {
      useFeaturedProductsStore.getState().setProducts(products);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
