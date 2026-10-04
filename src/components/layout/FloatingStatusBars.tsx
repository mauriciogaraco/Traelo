import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getCartItemCount, getCartSubtotalEstimate } from '../../features/cart'
import { isCartBarVisible } from '../../features/cart/floatingDismissal'
import { useActiveOrders } from '../../hooks/useActiveOrders'
import { useCartStore } from '../../store/cartStore'
import { formatCup } from '../catalog/Price'
import { Icon } from '../ui/Icon'
import { DismissibleBar } from './DismissibleBar'
import { isFlowRoute } from './navigation'

const DISMISSED_ORDERS_KEY = 'traelo_dismissed_order_bars'
const DISMISSED_CART_KEY = 'traelo_dismissed_cart_bar'

function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function writeSession(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sin sessionStorage el aviso solo queda quitado hasta recargar.
  }
}

/**
 * Avisos flotantes sobre la barra de navegación: el pedido en curso (si hay) y el carrito con
 * productos. Se pueden quitar (deslizando o con la X): el del pedido hasta que haya otro pedido, el
 * del carrito hasta que se agregue algo más. Se ocultan en las pantallas de flujo (producto,
 * checkout), que tienen su propia barra de acción, y en /carrito, que ya muestra su resumen fijo.
 */
export function FloatingStatusBars() {
  const { pathname } = useLocation()
  if (isFlowRoute(pathname) || pathname === '/carrito') return null
  return <Bars pathname={pathname} />
}

function Bars({ pathname }: { pathname: string }) {
  const items = useCartStore((state) => state.items)
  const activeOrders = useActiveOrders()
  const itemCount = getCartItemCount(items)
  const [dismissedOrders, setDismissedOrders] = useState<string[]>(() => readSession(DISMISSED_ORDERS_KEY, []))
  const [dismissedCartAt, setDismissedCartAt] = useState<number | null>(() => readSession(DISMISSED_CART_KEY, null))

  // Con el carrito vacío se olvida lo quitado: el próximo producto vuelve a mostrar el aviso.
  useEffect(() => {
    if (itemCount === 0 && dismissedCartAt !== null) {
      setDismissedCartAt(null)
      writeSession(DISMISSED_CART_KEY, null)
    }
  }, [itemCount, dismissedCartAt])

  // El pedido que se está mirando en pantalla, o que ya se quitó, no necesita su propio aviso.
  const visibleOrders = activeOrders.filter(
    (order) => pathname !== `/pedido/${order.orderId}` && !dismissedOrders.includes(order.orderId),
  )
  const showCart = isCartBarVisible(itemCount, dismissedCartAt)
  if (!showCart && visibleOrders.length === 0) return null

  const [order, ...others] = visibleOrders

  function dismissOrder(orderId: string) {
    const next = [...dismissedOrders, orderId].slice(-20)
    setDismissedOrders(next)
    writeSession(DISMISSED_ORDERS_KEY, next)
  }

  function dismissCart() {
    setDismissedCartAt(itemCount)
    writeSession(DISMISSED_CART_KEY, itemCount)
  }

  return (
    <div className="pointer-events-none fixed z-40 inset-x-0 mx-auto flex max-w-[560px] flex-col gap-2 px-3 bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] lg:bottom-6 lg:right-6 lg:left-auto lg:mx-0 lg:w-[360px] lg:px-0">
      {order && (
        <DismissibleBar onDismiss={() => dismissOrder(order.orderId)} closeLabel="Quitar aviso del pedido">
          <Link
            to={`/pedido/${order.orderId}`}
            draggable={false}
            className="flex items-center gap-3 rounded-r-lg bg-surface border border-border px-3.5 py-2.5 pr-5 shadow-float animate-fade-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold leading-5 text-text-primary">Pedido #{order.orderNumber} en curso</span>
              <span className="block truncate text-caption text-text-secondary">
                {order.label}
                {others.length > 0 ? ` · +${others.length} más` : ''}
              </span>
            </span>
            <span className="shrink-0 text-[13px] font-bold text-primary-text">Ver</span>
          </Link>
        </DismissibleBar>
      )}

      {showCart && (
        <DismissibleBar onDismiss={dismissCart} closeLabel="Quitar aviso del carrito">
          <Link
            to="/carrito"
            draggable={false}
            aria-label={`Ver carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
            className="flex items-center gap-3 rounded-r-lg bg-gradient-primary px-3.5 py-3 pr-5 text-white shadow-btn-primary animate-fade-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Icon name="cart" size={18} />
            </span>
            <span className="min-w-0 flex-1 text-[14px] font-bold leading-5">
              Ver carrito · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </span>
            <span className="shrink-0 text-[14px] font-bold">≈ {formatCup(getCartSubtotalEstimate(items))}</span>
          </Link>
        </DismissibleBar>
      )}
    </div>
  )
}
