import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Order } from '../types'
import { readStorage, writeStorage, STORAGE_KEYS } from '../lib/storage'

interface OrdersContextValue {
  orders: Order[]
  /** Persiste un pedido ya construido (ver makeOrder en lib/order). */
  saveOrder: (order: Order) => void
  markCompleted: (orderId: string) => void
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() =>
    readStorage<Order[]>(STORAGE_KEYS.orders, [])
  )

  useEffect(() => {
    writeStorage(STORAGE_KEYS.orders, orders)
  }, [orders])

  function saveOrder(order: Order) {
    setOrders((prev) => [order, ...prev])
  }

  function markCompleted(orderId: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'completado' as const } : o))
    )
  }

  return (
    <OrdersContext.Provider value={{ orders, saveOrder, markCompleted }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders debe usarse dentro de OrdersProvider')
  return ctx
}
