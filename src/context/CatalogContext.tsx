import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Business, Product } from '../types'
import type { CatalogBusiness, CatalogProduct } from '../types/backend/catalog'
import { _setBusinessCache } from '../data/catalog'
import { useCatalogStore } from '../store/catalogStore'

/**
 * TEMPORAL (hasta la fase 4): el catálogo ya sale del backend (`store/catalogStore`, igual que la
 * app móvil), pero la ficha de producto, el carrito, el checkout y "Mis pedidos" todavía usan los
 * tipos de la web anterior. Este contexto traduce el catálogo del backend a esos tipos para que
 * sigan funcionando mientras se reemplazan; las pantallas nuevas leen el store directamente.
 */
interface CatalogState {
  businesses: Business[]
  products: Product[]
  loading: boolean
  syncing: boolean
  loadBusinessProducts: (businessId: string) => Promise<void>
  getFullProduct: (productId: string) => Product | undefined
  isBusinessLoaded: (businessId: string) => boolean
}

const CatalogContext = createContext<CatalogState | null>(null)

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function hoursLabel(business: CatalogBusiness): string {
  const open = business.hours.filter((h) => !h.closed)
  if (open.length === 0) return 'Sin horario'
  const first = open[0]!
  const sameHours = open.every((h) => h.openTime === first.openTime && h.closeTime === first.closeTime)
  const days = open.map((h) => DAY_NAMES[h.dayOfWeek]).join(', ')
  return sameHours ? `${days} · ${first.openTime} – ${first.closeTime}` : days
}

/** "Abierto/cerrado" lo decide el backend (`isOpenNow`), nunca el horario en el navegador. */
export function toLegacyBusiness(business: CatalogBusiness): Business {
  const open = business.acceptingOrders && business.isOpenNow
  return {
    id: business.id,
    name: business.name,
    description: business.address,
    image: business.logoUrl ?? '',
    color: 'from-orange-100 to-amber-50',
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], open: '00:00', close: '24:00', label: hoursLabel(business) },
    ...(open ? {} : { status: 'cerrado' as const }),
  }
}

/** El precio del backend ya es el de la caja: el carrito viejo lo usa tal cual (sin volver a multiplicar). */
export function toLegacyProduct(product: CatalogProduct, businessName: string): Product {
  return {
    id: product.id,
    name: product.name,
    businessId: product.businessId,
    businessName,
    category: (product.categoryName ?? product.category ?? 'Alimentos') as Product['category'],
    shortDescription: product.description ?? '',
    longDescription: product.description ?? undefined,
    image: '🛍️',
    photo: product.imageUrl ?? undefined,
    price: product.effectivePrice ?? product.price ?? 0,
    options: product.options ?? undefined,
    addons: product.addons ?? undefined,
    packaging: product.packaging ?? undefined,
    stockStatus: product.lowStock ? 'pocas' : 'disponible',
    featured: product.featured,
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const catalogBusinesses = useCatalogStore((state) => state.businesses)
  const catalogProducts = useCatalogStore((state) => state.products)
  const hydrated = useCatalogStore((state) => state.hydrated)
  const isSyncing = useCatalogStore((state) => state.isSyncing)

  const value = useMemo<CatalogState>(() => {
    const businesses = catalogBusinesses.map(toLegacyBusiness)
    _setBusinessCache(businesses)
    const nameById = new Map(catalogBusinesses.map((b) => [b.id, b.name]))
    const products = catalogProducts.map((p) => toLegacyProduct(p, nameById.get(p.businessId) ?? ''))
    return {
      businesses,
      products,
      loading: !hydrated || (catalogBusinesses.length === 0 && isSyncing),
      syncing: isSyncing,
      // El bootstrap ya trae todos los productos completos: no hay carga por negocio.
      loadBusinessProducts: async () => {},
      getFullProduct: (productId) => products.find((p) => p.id === productId),
      isBusinessLoaded: () => true,
    }
  }, [catalogBusinesses, catalogProducts, hydrated, isSyncing])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog debe usarse dentro de CatalogProvider')
  return ctx
}
