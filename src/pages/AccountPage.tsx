import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OrderRow } from '../components/orders/OrderRow'
import { PointsCard } from '../components/rewards/PointsCard'
import { ThemeSelector } from '../components/settings/ThemeSelector'
import { Button } from '../components/ui/Button'
import { Icon, type IconName } from '../components/ui/Icon'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../context/ToastContext'
import { getOrderStatusLabel, isOrderActive, ORDER_STATUS_TONE } from '../features/orders/orderStatus'
import { useAuth } from '../hooks/useAuth'
import { useCustomerOrders } from '../hooks/useCustomerOrders'
import { logout } from '../services/authService'
import { useGuestOrdersStore } from '../store/guestStore'
import type { Order } from '../types/backend/order'

type MenuItem = { to: string; label: string; icon: IconName; tint: string; accountOnly?: boolean }

const MENU: MenuItem[] = [
  { to: '/pedidos', label: 'Mis pedidos', icon: 'receipt', tint: 'bg-primary-soft text-primary' },
  // Las direcciones viven en este navegador: las ve cualquiera, con o sin cuenta.
  { to: '/direcciones', label: 'Direcciones', icon: 'location', tint: 'bg-primary-soft text-primary' },
  { to: '/favoritos', label: 'Favoritos', icon: 'heart', tint: 'bg-danger/10 text-danger', accountOnly: true },
  { to: '/valoraciones', label: 'Valoraciones', icon: 'star', tint: 'bg-gold-soft text-gold-text', accountOnly: true },
  { to: '/notificaciones', label: 'Notificaciones', icon: 'bell', tint: 'bg-gold-soft text-gold-text' },
  { to: '/ayuda', label: 'Ayuda', icon: 'help', tint: 'bg-info/10 text-info' },
]

/**
 * "Mi cuenta" (`AccountScreen` de mobile). Sin cuenta es una invitación — nunca un requisito: iniciar
 * sesión / crear cuenta, más los pedidos hechos como invitado en este navegador. Con cuenta: perfil,
 * atajos, pedidos en curso e historial.
 */
export function AccountPage() {
  const { isAuthenticated, isLoading, customer } = useAuth()
  const guestOrders = useGuestOrdersStore((state) => state.orders)
  const { orders, loading, loadingMore, hasMore, error, reload, loadMore } = useCustomerOrders(isAuthenticated)

  if (isLoading) {
    return (
      <div className="px-4 lg:px-0 pt-6">
        <RowsSkeleton rows={4} />
      </div>
    )
  }

  const guestSection =
    guestOrders.length > 0 ? (
      <section className="space-y-2">
        <h2 className="text-h3 text-text-primary">{isAuthenticated ? 'Pedidos hechos sin cuenta' : 'Pedidos'}</h2>
        <ul className="space-y-2">
          {guestOrders.map((order) => (
            <li key={order.orderId}>
              <OrderRow to={`/pedido/${order.orderId}`} orderNumber={order.orderNumber} date={order.createdAt} />
            </li>
          ))}
        </ul>
      </section>
    ) : null

  if (!isAuthenticated) {
    return (
      <div className="px-4 lg:px-0 pt-6 pb-10 space-y-5 max-w-2xl mx-auto">
        <div className="rounded-r-lg bg-gradient-primary p-5 text-white shadow-card">
          <h1 className="text-h2">Bienvenido a Tráelo</h1>
          <p className="mt-1 text-body opacity-95">
            Con tu cuenta ves tus pedidos, guardas tus direcciones y favoritos, y valoras tus entregas. Para pedir no
            la necesitas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-r-md bg-gradient-primary px-4 font-semibold text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="inline-flex min-h-12 items-center justify-center rounded-r-md border border-primary px-4 font-semibold text-primary-text hover:bg-primary/5"
          >
            Crear cuenta
          </Link>
        </div>

        <PointsCard />

        {guestSection ?? (
          <section className="space-y-1" data-testid="guest-no-orders">
            <h2 className="text-h3 text-text-primary">Pedidos</h2>
            <p className="text-body text-text-primary">Tus pedidos aparecerán aquí.</p>
            <p className="text-caption text-text-secondary">Inicia sesión para ver todo tu historial.</p>
          </section>
        )}

        <Menu authenticated={false} />

        <ThemeSelector />
      </div>
    )
  }

  const active = orders.filter((o) => isOrderActive(o.status))
  const history = orders.filter((o) => !isOrderActive(o.status))

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 rounded-r-lg bg-gradient-primary p-5 text-white shadow-card">
        <span
          aria-hidden="true"
          className="w-14 h-14 shrink-0 rounded-full bg-white/25 flex items-center justify-center text-h1"
        >
          {(customer?.name ?? '?').trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="text-h2 truncate">Hola, {customer?.name}</h1>
          <p className="text-body opacity-95">{customer?.phone}</p>
        </div>
      </div>

      <PointsCard />

      <Menu authenticated />

      <ThemeSelector />

      {loading && orders.length === 0 && <RowsSkeleton rows={3} />}
      {error && (
        <div className="rounded-r-lg bg-surface-muted p-4 space-y-3">
          <p className="text-body text-text-primary">No pudimos cargar tus pedidos.</p>
          <Button variant="outline" onClick={() => void reload()}>
            Reintentar
          </Button>
        </div>
      )}

      <OrdersSection title="Pedidos activos" empty="No tienes pedidos en curso." orders={active} />
      <OrdersSection title="Historial" empty="Todavía no tienes pedidos completados." orders={history} />
      {hasMore && (
        <Button variant="outline" fullWidth onClick={() => void loadMore()} loading={loadingMore}>
          Cargar más
        </Button>
      )}

      {guestSection}

      <LogoutButton />
    </div>
  )
}

function Menu({ authenticated }: { authenticated: boolean }) {
  const items = MENU.filter((item) => authenticated || !item.accountOnly)
  return (
    <nav aria-label="Atajos de la cuenta" className="rounded-r-lg bg-surface border border-border/60 shadow-card divide-y divide-border">
      {items.map((item) => (
        <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3 hover:bg-surface-muted transition">
          <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${item.tint}`}>
            <Icon name={item.icon} size={22} />
          </span>
          <span className="flex-1 font-semibold text-text-primary">{item.label}</span>
          <Icon name="chevron-right" size={18} className="text-text-tertiary" />
        </Link>
      ))}
    </nav>
  )
}

function OrdersSection({ title, empty, orders }: { title: string; empty: string; orders: Order[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      {orders.length === 0 ? (
        <p className="text-caption text-text-secondary">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderRow
                to={`/pedido/${order.id}`}
                orderNumber={order.orderNumber}
                date={order.orderDate}
                trailing={
                  <StatusBadge label={getOrderStatusLabel(order.status)} tone={ORDER_STATUS_TONE[order.status] ?? 'neutral'} />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function LogoutButton() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [closing, setClosing] = useState(false)

  async function handleLogout() {
    setClosing(true)
    try {
      await logout()
      showToast('Sesión cerrada', 'info')
      navigate('/', { replace: true })
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="pt-2 space-y-3">
      <Button variant="outline" fullWidth onClick={() => void handleLogout()} loading={closing}>
        Cerrar sesión
      </Button>
      <p className="text-center text-caption text-text-secondary">
        <Link to="/borrarusuario" className="underline">
          Solicitar la eliminación de mi cuenta y mis datos
        </Link>
      </p>
    </div>
  )
}
