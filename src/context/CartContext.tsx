import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product } from '../types'
import { readStorage, writeStorage, STORAGE_KEYS } from '../lib/storage'
import { lineTotal, lineId, itemLineId } from '../lib/cart'
import { computeFee } from '../lib/fees'

interface CartContextValue {
  items: CartItem[]
  /** Añade un producto. `option` es el tipo/sabor elegido (si aplica). */
  addItem: (product: Product, quantity?: number, option?: string) => void
  /** Operaciones por id de línea (usa lineId / itemLineId de lib/cart). */
  removeItem: (lineKey: string) => void
  setQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
  getQuantity: (lineKey: string) => number
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

  const addItem = useCallback((product: Product, quantity = 1, option?: string) => {
    const key = lineId(product.id, option)
    setItems((prev) => {
      const existing = prev.find((i) => itemLineId(i) === key)
      if (existing) {
        return prev.map((i) =>
          itemLineId(i) === key ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { product, quantity, option }]
    })
  }, [])

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
    subtotal,
    fee,
    total: subtotal + fee,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
