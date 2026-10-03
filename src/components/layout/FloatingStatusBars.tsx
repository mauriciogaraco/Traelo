import { Link, useLocation } from 'react-router-dom'
import { getCartItemCount, getCartSubtotalEstimate } from '../../features/cart'
import { useActiveOrders } from '../../hooks/useActiveOrders'
import { useCartStore } from '../../store/cartStore'
import { formatCup } from '../catalog/Price'
import { Icon } from '../ui/Icon'
import { isFlowRoute } from './navigation'

/**
 * Avisos flotantes sobre la barra de navegación: el pedido en curso (si hay) y el carrito con
 * productos. Se ocultan en las pantallas de flujo (producto, checkout), que tienen su propia barra
 * de acción, y en /carrito, que ya muestra su resumen fijo.
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

  // El pedido que se está mirando en pantalla no necesita su propio aviso.
  const visibleOrders = activeOrders.filter((order) => pathname !== `/pedido/${order.orderId}`)
  if (itemCount === 0 && visibleOrders.length === 0) return null

  const [order, ...others] = visibleOrders

  return (
    <div className="pointer-events-none fixed z-40 inset-x-0 mx-auto flex max-w-[560px] flex-col gap-2 px-3 bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] lg:bottom-6 lg:right-6 lg:left-auto lg:mx-0 lg:w-[360px] lg:px-0">
      {order && (
        <Link
          to={`/pedido/${order.orderId}`}
          className="pointer-events-auto flex items-center gap-3 rounded-r-lg bg-surface border border-border px-3.5 py-2.5 shadow-float animate-fade-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
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
      )}

      {itemCount > 0 && (
        <Link
          to="/carrito"
          aria-label={`Ver carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
          className="pointer-events-auto flex items-center gap-3 rounded-r-lg bg-gradient-primary px-3.5 py-3 text-white shadow-btn-primary animate-fade-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Icon name="cart" size={18} />
          </span>
          <span className="min-w-0 flex-1 text-[14px] font-bold leading-5">
            Ver carrito · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
          <span className="shrink-0 text-[14px] font-bold">≈ {formatCup(getCartSubtotalEstimate(items))}</span>
        </Link>
      )}
    </div>
  )
}
