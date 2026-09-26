import { findProductByLegacyId } from '../features/catalog'
import { useAddressStore } from '../store/addressStore'
import { useCartStore } from '../store/cartStore'
import { useGuestProfileStore } from '../store/guestStore'
import type { CatalogProduct } from '../types/backend/catalog'

/*
 * Una sola vez por navegador: lo que la web anterior guardaba en localStorage (dirección y carrito,
 * con el catálogo en JSON) pasa a los stores nuevos, para que quien ya usaba la web no pierda nada.
 * Los pedidos viejos se siguen mostrando en "Mis pedidos" (solo lectura, ver OrdersPage).
 */

const LEGACY_ADDRESS_KEY = 'traelo_address'
const LEGACY_CART_KEY = 'traelo_cart'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Sin almacenamiento: no hay nada que migrar.
  }
}

type LegacyAddress = { nombre?: string; apellidos?: string; telefono?: string; direccion?: string; referencia?: string }

/** Dirección + nombre/teléfono del formulario anterior → libreta local y perfil de invitado. */
export function migrateLegacyAddress(): void {
  const legacy = readJson<LegacyAddress>(LEGACY_ADDRESS_KEY)
  if (!legacy) return
  const address = legacy.direccion?.trim() ?? ''
  if (address.length >= 3 && useAddressStore.getState().addresses.length === 0) {
    useAddressStore.getState().add({ label: 'Casa', address, reference: legacy.referencia?.trim() || null })
  }
  const profile = useGuestProfileStore.getState()
  if (!profile.name && !profile.phone) {
    profile.setProfile({
      name: [legacy.nombre, legacy.apellidos].filter(Boolean).join(' ').trim(),
      phone: legacy.telefono?.trim() ?? '',
      address: profile.address || address,
      addressReference: profile.addressReference || (legacy.referencia?.trim() ?? ''),
    })
  }
  remove(LEGACY_ADDRESS_KEY)
}

type LegacyCartItem = {
  product?: { id?: string }
  quantity?: number
  option?: string
  addon?: { name?: string }
  packaging?: { name?: string }
}

/**
 * Carrito anterior → carrito nuevo. Cada producto se busca por su id viejo (`externalId` en el
 * backend); lo que ya no existe se descarta. Necesita el catálogo cargado: devuelve false si todavía
 * no hay productos (se reintenta cuando lleguen).
 */
export function migrateLegacyCart(products: CatalogProduct[]): boolean {
  const legacy = readJson<LegacyCartItem[]>(LEGACY_CART_KEY)
  if (!legacy || !Array.isArray(legacy) || legacy.length === 0) {
    remove(LEGACY_CART_KEY)
    return true
  }
  if (products.length === 0) return false
  const { addItem } = useCartStore.getState()
  for (const item of legacy) {
    const product = item.product?.id ? findProductByLegacyId(item.product.id, products) : undefined
    if (!product || !item.quantity || item.quantity < 1) continue
    addItem(product, Math.min(99, item.quantity), {
      optionName: item.option ?? null,
      addonName: item.addon?.name ?? null,
      packagingName: item.packaging?.name ?? null,
    })
  }
  remove(LEGACY_CART_KEY)
  return true
}
