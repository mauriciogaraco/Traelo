import { useEffect, useRef, useState } from 'react'
import { listCustomerOrders } from '../api/customerOrders'
import { getOrderStatus } from '../api/orderAccess'
import { guestOrdersToCheck } from '../features/orders/activeOrders'
import { getOrderStatusLabel, isOrderActive, normalizeOrderStatus } from '../features/orders/orderStatus'
import { isTrackingActive } from '../features/orders/tracking'
import { useGuestOrdersStore, useOrderStore } from '../store/guestStore'
import { useAuth } from './useAuth'

const POLL_MS = 30_000

export type ActiveOrder = { orderId: string; orderNumber: number; label: string }

/**
 * Pedidos en curso de este navegador (de invitado, y de la cuenta si hay sesión) para el aviso
 * flotante. Consulta el estado cada 30 s con la pestaña visible; los pedidos que ya terminaron
 * dejan de consultarse. Un fallo de red conserva lo último que se sabía (no parpadea).
 */
export function useActiveOrders(): ActiveOrder[] {
  const guestOrders = useGuestOrdersStore((state) => state.orders)
  const lastCreatedId = useOrderStore((state) => state.lastCreatedOrder?.id)
  const { isAuthenticated } = useAuth()
  const [active, setActive] = useState<ActiveOrder[]>([])
  const activeRef = useRef(active)
  activeRef.current = active
  const finishedRef = useRef(new Set<string>())
  const guestOrdersRef = useRef(guestOrders)
  guestOrdersRef.current = guestOrders

  const guestKey = guestOrders.map((o) => o.orderId).join(',')

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const check = async () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        const found = new Map<string, ActiveOrder>()
        const previous = new Map(activeRef.current.map((o) => [o.orderId, o]))

        await Promise.all(
          guestOrdersToCheck(guestOrdersRef.current, Date.now(), finishedRef.current).map(async (ref) => {
            try {
              const poll = await getOrderStatus(ref.orderId, { kind: 'guest', token: ref.token })
              if (isTrackingActive(poll.status)) {
                found.set(ref.orderId, { orderId: ref.orderId, orderNumber: poll.orderNumber, label: getOrderStatusLabel(poll.status) })
              } else {
                finishedRef.current.add(ref.orderId)
              }
            } catch {
              const kept = previous.get(ref.orderId)
              if (kept) found.set(ref.orderId, kept)
            }
          }),
        )

        if (isAuthenticated) {
          try {
            const page = await listCustomerOrders(1, 5)
            for (const raw of page.data) {
              const order = normalizeOrderStatus(raw)
              if (isOrderActive(order.status)) {
                found.set(order.id, { orderId: order.id, orderNumber: order.orderNumber, label: getOrderStatusLabel(order.status) })
              }
            }
          } catch {
            for (const kept of previous.values()) if (!found.has(kept.orderId)) found.set(kept.orderId, kept)
          }
        }

        if (!cancelled) setActive([...found.values()].sort((a, b) => b.orderNumber - a.orderNumber))
      }
      if (!cancelled) timer = window.setTimeout(() => void check(), POLL_MS)
    }

    void check()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [guestKey, isAuthenticated, lastCreatedId])

  return active
}
