import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderDetail, type OrderAccess } from '../api/orderAccess'
import { formatCup } from '../components/catalog/Price'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { getOrderStatusLabel, ORDER_STATUS_TONE } from '../features/orders/orderStatus'
import { useAuth } from '../hooks/useAuth'
import { useGuestOrdersStore, useOrderStore } from '../store/guestStore'
import type { Order } from '../types/backend/order'

/**
 * Pedido — confirmación y detalle con los datos del backend (estado real, productos, desglose y
 * total). El seguimiento completo (recorrido del mensajero, mapa, valoraciones), como `OrderScreen`
 * de mobile, llega en la fase 5.
 */
export function OrderPage() {
  const { id = '' } = useParams()
  const guestRef = useGuestOrdersStore((state) => state.orders.find((o) => o.orderId === id))
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // Un pedido de invitado se abre con su token; el resto, con la cuenta (Bearer).
  const access: OrderAccess | null = guestRef ? { kind: 'guest', token: guestRef.token } : isAuthenticated ? { kind: 'customer' } : null
  const justCreated = useOrderStore((state) => (state.lastCreatedOrder?.id === id ? state.lastCreatedOrder : null))
  const [order, setOrder] = useState<Order | null>(justCreated)
  const [loading, setLoading] = useState(!justCreated)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!access) return
    setLoading(true)
    setError(null)
    try {
      setOrder(await getOrderDetail(id, access))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar el pedido.')
    } finally {
      setLoading(false)
    }
    // `access` se recrea en cada render: se depende de sus partes estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, guestRef, isAuthenticated])

  useEffect(() => {
    if (!justCreated) void load()
  }, [justCreated, load])

  if (!access && !order) {
    if (authLoading) {
      return (
        <div className="px-4 pt-6">
          <RowsSkeleton rows={4} />
        </div>
      )
    }
    return (
      <EmptyState
        icon="receipt"
        title="No encontramos este pedido"
        description="Solo puedes ver aquí los pedidos hechos desde este navegador o con tu cuenta."
        action={
          <Link to="/pedidos" className="inline-flex min-h-12 items-center rounded-r-md border border-primary px-4 font-semibold text-primary-text">
            Ver mis pedidos
          </Link>
        }
      />
    )
  }

  if (!order) {
    if (loading) {
      return (
        <div className="px-4 pt-6">
          <RowsSkeleton rows={4} />
        </div>
      )
    }
    return <ErrorState title="No pudimos cargar el pedido" description={error ?? undefined} onRetry={() => void load()} />
  }

  const created = order.id === justCreated?.id
  const raffleNumber = order.raffleNumber

  return (
    <div className="px-4 lg:px-0 pt-4 lg:pt-6 pb-10 space-y-4">
      <header className="space-y-2">
        {created && <p className="text-h2 text-text-primary">¡Pedido recibido! 🎉</p>}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-h1 text-text-primary">Pedido #{order.orderNumber}</h1>
          <StatusBadge label={getOrderStatusLabel(order.status)} tone={ORDER_STATUS_TONE[order.status] ?? 'neutral'} />
        </div>
        <p className="text-caption text-text-secondary">
          {new Date(order.orderDate ?? order.createdAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
        {raffleNumber != null && (
          <p className="rounded-r-md bg-gold-soft px-3 py-2 text-[15px] font-semibold text-gold-text">🎟️ Número del sorteo: #{raffleNumber}</p>
        )}
      </header>

      <section className="rounded-r-md bg-surface border border-border p-3 space-y-1">
        <h2 className="text-h3 text-text-primary">Entrega</h2>
        <p className="text-body text-text-primary">
          {order.customerName} · {order.customerPhone}
        </p>
        <p className="text-body text-text-primary">{order.customerAddress}</p>
        {order.addressReference && <p className="text-caption text-text-secondary">{order.addressReference}</p>}
        {order.scheduledFor && <p className="text-caption font-semibold text-text-secondary">{order.scheduledFor}</p>}
        {order.delivererName && <p className="text-caption text-text-secondary">Mensajero: {order.delivererName}</p>}
      </section>

      {order.businesses.map((group) => (
        <section key={group.id} className="rounded-r-md bg-surface border border-border p-3 space-y-2">
          <h2 className="text-h3 text-text-primary">{group.businessName}</h2>
          <ul className="space-y-1.5">
            {group.items.map((item) => {
              const units = item.unitsPerPack && item.unitsPerPack > 1 ? item.unitsPerPack : 1
              const extras = [
                item.optionName,
                item.addonName ? `+ ${item.addonName}` : null,
                item.packagingName ? `Envase: ${item.packagingName}` : null,
              ].filter(Boolean)
              return (
                <li key={item.id} className="flex justify-between gap-3 text-body">
                  <span className="min-w-0">
                    <span className="text-text-primary">
                      {item.quantity} × {item.productName}
                    </span>
                    {units > 1 && <span className="block text-caption text-text-secondary">Caja de {units} unidades</span>}
                    {extras.length > 0 && <span className="block text-caption text-text-secondary">{extras.join(' · ')}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-text-primary">
                    {formatCup(item.subtotal + (item.packagingFee ?? 0))}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <section aria-label="Total del pedido" className="rounded-r-md bg-surface border border-border p-3 space-y-1 text-body text-text-primary">
        <Row label="Productos" value={formatCup(order.productsTotal - (order.packagingTotal ?? 0))} />
        {(order.packagingTotal ?? 0) > 0 && <Row label="Empaque" value={formatCup(order.packagingTotal ?? 0)} />}
        <Row label="Mensajería" value={formatCup(order.deliveryFee)} />
        <Row label="Servicio Tráelo" value={formatCup(order.platformFee)} />
        {(order.pointsDiscount ?? 0) > 0 && <Row label="Canje con puntos" value={`−${formatCup(order.pointsDiscount ?? 0)}`} />}
        <Row label="Total a pagar" value={formatCup(order.total)} strong />
      </section>

      <div className="space-y-2">
        {guestRef && (
          <Button fullWidth variant="outline" loading={loading} onClick={() => void load()}>
            Actualizar estado
          </Button>
        )}
        <Link to="/" className="flex min-h-12 items-center justify-center rounded-r-md bg-gradient-primary font-semibold text-white">
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'pt-1 font-bold text-base' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
