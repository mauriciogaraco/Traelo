import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Addon, CartItem, Packaging, Product } from '../types'
import { readStorage, writeStorage, STORAGE_KEYS } from '../lib/storage'
import { lineTotal, lineId, itemLineId } from '../lib/cart'
import { computeFee } from '../lib/fees'
import { useCatalog } from './CatalogContext'

interface CartContextValue {
  items: CartItem[]
  /** Añade un producto. `option` = tipo/sabor, `addon` = agrego, `packaging` = envase. */
  addItem: (
    product: Product,
    quantity?: number,
    option?: string,
    addon?: Addon,
    packaging?: Packaging,
  ) => void
  /** Operaciones por id de línea (usa lineId / itemLineId de lib/cart). */
  removeItem: (lineKey: string) => void
  setQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
  getQuantity: (lineKey: string) => number
  /** Actualiza precios del carrito contra el catálogo actual. */
  syncPrices: (catalogProducts: Product[]) => void
  subtotal: number
  /** Tarifa de mensajería (0 si el carrito está vacío). */
  fee: number
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  )

  useEffect(() => {
    writeStorage(STORAGE_KEYS.cart, items)
  }, [items])

  const addItem = useCallback(
    (product: Product, quantity = 1, option?: string, addon?: Addon, packaging?: Packaging) => {
      const key = lineId(product.id, option, addon?.name, packaging?.name)
      setItems((prev) => {
        const existing = prev.find((i) => itemLineId(i) === key)
        if (existing) {
          return prev.map((i) =>
            itemLineId(i) === key ? { ...i, quantity: i.quantity + quantity } : i
          )
        }
        return [...prev, { product, quantity, option, addon, packaging }]
      })
    },
    []
  )

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) => prev.filter((i) => itemLineId(i) !== lineKey))
  }, [])

  const setQuantity = useCallback(
    (lineKey: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(lineKey)
        return
      }
      setItems((prev) =>
        prev.map((i) => (itemLineId(i) === lineKey ? { ...i, quantity } : i))
      )
    },
    [removeItem]
  )

  const clearCart = useCallback(() => setItems([]), [])

  const getQuantity = useCallback(
    (lineKey: string) => items.find((i) => itemLineId(i) === lineKey)?.quantity ?? 0,
    [items]
  )

  const syncPrices = useCallback((catalogProducts: Product[]) => {
    setItems((prev) => {
      let changed = false
      const next = prev.map((item) => {
        const fresh = catalogProducts.find((p) => p.id === item.product.id)
        if (!fresh) return item

        let updated = item

        if (fresh.price !== item.product.price) {
          updated = { ...updated, product: { ...updated.product, price: fresh.price } }
          changed = true
        }

        if (item.addon && fresh.addons) {
          const freshAddon = fresh.addons.find((a) => a.name === item.addon!.name)
          if (freshAddon && freshAddon.price !== item.addon.price) {
            updated = { ...updated, addon: { ...item.addon, price: freshAddon.price } }
            changed = true
          }
        }

        if (item.packaging && fresh.packaging) {
          const freshPkg = fresh.packaging.find((p) => p.name === item.packaging!.name)
          if (freshPkg && freshPkg.price !== item.packaging.price) {
            updated = { ...updated, packaging: { ...item.packaging, price: freshPkg.price } }
            changed = true
          }
        }

        return updated
      })
      return changed ? next : prev
    })
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + lineTotal(i), 0),
    [items]
  )

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  // Estimación de tarifa "ahora" (en checkout se recalcula con la hora elegida).
  const fee = computeFee(items).fee

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    getQuantity,
    syncPrices,
    subtotal,
    fee,
    total: subtotal + fee,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/** Puente sin UI: sincroniza precios del carrito cuando llegan datos frescos del catálogo. */
export function CartPriceSyncer() {
  const { products } = useCatalog()
  const { syncPrices } = useCart()

  useEffect(() => {
    if (products.length > 0) syncPrices(products)
  }, [products, syncPrices])

  return null
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
