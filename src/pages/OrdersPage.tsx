import { Link } from 'react-router-dom'
import { formatCup } from '../components/catalog/Price'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { useGuestOrdersStore } from '../store/guestStore'

/** Pedido de la web anterior (catálogo en JSON, enviado por Telegram): solo se muestra. */
type LegacyOrder = { id: string; date: string; total: number }

function readLegacyOrders(): LegacyOrder[] {
  try {
    const raw = localStorage.getItem('traelo_orders')
    const parsed = raw ? (JSON.parse(raw) as LegacyOrder[]) : []
    return Array.isArray(parsed) ? parsed.filter((o) => o && o.id && o.date) : []
  } catch {
    return []
  }
}

const formatDate = (iso: string) => new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * Mis pedidos — los hechos desde este navegador sin cuenta (como los "pedidos de invitado" de la app
 * móvil: el token de cada uno vive solo aquí). Con cuenta, el historial completo llega en la fase 5.
 */
export function OrdersPage() {
  const orders = useGuestOrdersStore((state) => state.orders)
  const legacy = readLegacyOrders()

  if (orders.length === 0 && legacy.length === 0) {
    return (
      <>
        <Header />
        <EmptyState
          icon="receipt"
          title="Aún no tienes pedidos"
          description="Cuando hagas tu primer pedido aparecerá aquí para que le hagas seguimiento."
          action={
            <Link to="/" className="inline-flex min-h-12 items-center rounded-r-md bg-gradient-primary px-5 font-semibold text-white">
              Empezar a comprar
            </Link>
          }
        />
      </>
    )
  }

  return (
    <div className="pb-10">
      <Header />
      <div className="px-4 lg:px-0 space-y-6">
        {orders.length > 0 && (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.orderId}>
                <Link
                  to={`/pedido/${order.orderId}`}
                  className="flex items-center gap-3 rounded-r-lg bg-surface border border-border/60 shadow-card p-3 hover:shadow-card-hover transition"
                >
                  <span className="w-11 h-11 shrink-0 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                    <Icon name="receipt" size={22} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold text-text-primary">Pedido #{order.orderNumber}</span>
                    <span className="block text-caption text-text-secondary">{formatDate(order.createdAt)}</span>
                    {order.raffleNumber != null && (
                      <span className="block text-caption text-gold-text">🎟️ Sorteo #{order.raffleNumber}</span>
                    )}
                  </span>
                  <Icon name="chevron-right" size={18} className="text-text-tertiary" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {legacy.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-h3 text-text-primary">Pedidos anteriores</h2>
            <p className="text-caption text-text-secondary">Hechos con la versión anterior de la web. Para cualquier duda, escríbenos por WhatsApp.</p>
            <ul className="divide-y divide-border rounded-r-lg bg-surface border border-border/60">
              {legacy.map((order) => (
                <li key={`${order.id}-${order.date}`} className="flex justify-between gap-3 p-3 text-body">
                  <span>
                    <span className="block font-semibold text-text-primary">Pedido #{order.id}</span>
                    <span className="block text-caption text-text-secondary">{formatDate(order.date)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-text-primary">{formatCup(order.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className="px-4 lg:px-0 pt-4 lg:pt-6 pb-4">
      <h1 className="text-h1 text-text-primary">Mis pedidos</h1>
    </header>
  )
}
