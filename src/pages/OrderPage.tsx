import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { OrderAccess } from '../api/orderAccess'
import { formatCup } from '../components/catalog/Price'
import { CourierCard } from '../components/orders/CourierCard'
import { CourierTrackingPanel } from '../components/orders/CourierTrackingPanel'
import { OrderTracker } from '../components/orders/OrderTracker'
import { ReviewSheet } from '../components/orders/ReviewSheet'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { getOrderStatusLabel, ORDER_STATUS_TONE } from '../features/orders/orderStatus'
import { isTrackingActive, mapOrderStatusToTrackingStep, stagesOf } from '../features/orders/tracking'
import { useAuth } from '../hooks/useAuth'
import { useOrderReviews } from '../hooks/useOrderReviews'
import { useOrderTracking } from '../hooks/useOrderTracking'
import { useGuestOrdersStore, useOrderStore } from '../store/guestStore'

/**
 * Pedido — confirmación, seguimiento y detalle con los datos del backend (`OrderScreen` de mobile).
 * Mientras el pedido está activo se consulta su estado cada 15 s (`useOrderTracking`) y el recorrido
 * (Aceptado → Entregado) avanza solo y, desde "Recogiendo", aparece el mapa con el mensajero. Un fallo de
 * red no borra lo último que se sabía.
 */
export function OrderPage() {
  const { id = '' } = useParams()
  const guestRef = useGuestOrdersStore((state) => state.orders.find((o) => o.orderId === id))
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // Un pedido de invitado se abre con su token; el resto, con la cuenta (Bearer).
  const guestToken = guestRef?.token
  const access = useMemo<OrderAccess | null>(
    () => (guestToken ? { kind: 'guest', token: guestToken } : isAuthenticated ? { kind: 'customer' } : null),
    [guestToken, isAuthenticated],
  )
  const justCreated = useOrderStore((state) => (state.lastCreatedOrder?.id === id ? state.lastCreatedOrder : null))
  const { order, status, loading, refreshing, error, refresh } = useOrderTracking(id, access, { initialOrder: justCreated })

  // Valorar exige CUENTA (una reseña tiene que pertenecer a alguien): un pedido de invitado no consulta ni ofrece valoraciones.
  const isGuestAccess = access?.kind === 'guest'
  const earlyStatus = status?.status ?? order?.status
  const reviews = useOrderReviews(id, access, earlyStatus === 'COMPLETED' && !isGuestAccess)

  const [reviewSheetOpen, setReviewSheetOpen] = useState(false)
  // Si el pedido pasa a ENTREGADO mientras se está mirando, se invita a valorar (una sola vez, sin bloquear nada).
  const previousStatus = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (isTrackingActive(previousStatus.current) && earlyStatus === 'COMPLETED') setReviewSheetOpen(true)
    previousStatus.current = earlyStatus
  }, [earlyStatus])

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
    return (
      <ErrorState
        title="No pudimos cargar el pedido"
        description={error === 'offline' ? 'Parece que no hay conexión. Inténtalo de nuevo.' : undefined}
        onRetry={() => void refresh()}
      />
    )
  }

  const created = order.id === justCreated?.id
  const raffleNumber = order.raffleNumber
  // El estado vivo (polling) manda; si todavía no llegó, el del detalle.
  const currentStatus = status?.status ?? order.status
  const stages = stagesOf(status)
  const headline = mapOrderStatusToTrackingStep(currentStatus, stages).headline

  return (
    <div className="px-4 lg:px-0 pt-4 lg:pt-6 pb-10 space-y-4 max-w-2xl mx-auto">
      <header className="space-y-2">
        {created && <p className="text-h2 text-text-primary">¡Pedido recibido! 🎉</p>}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-h1 text-text-primary">Pedido #{order.orderNumber}</h1>
          <StatusBadge label={getOrderStatusLabel(currentStatus)} tone={ORDER_STATUS_TONE[currentStatus] ?? 'neutral'} />
        </div>
        <p className="text-caption text-text-secondary">
          {new Date(order.orderDate ?? order.createdAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
        {raffleNumber != null && (
          <p className="rounded-r-md bg-gold-soft px-3 py-2 text-[15px] font-semibold text-gold-text">🎟️ Número del sorteo: #{raffleNumber}</p>
        )}
      </header>

      <section aria-label="Seguimiento del pedido" className="rounded-r-lg bg-surface border border-border p-4 space-y-4">
        <p className="text-h3 text-text-primary" aria-live="polite">
          {headline}
        </p>
        {error && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-r-md bg-warning/10 px-3 py-2 text-caption text-warning-text">
            <span>{error === 'offline' ? 'Sin conexión: mostramos lo último que sabíamos.' : 'No pudimos actualizar el estado.'}</span>
            <button type="button" onClick={() => void refresh()} className="shrink-0 font-semibold underline">
              Reintentar
            </button>
          </div>
        )}
        <OrderTracker
          status={currentStatus}
          stages={stages}
          times={{
            accepted: order.orderDate ?? order.createdAt,
            confirmed: status?.assignedAt ?? order.assignedAt,
            pickingUp: status?.pickingUpAt ?? order.pickingUpAt,
            onTheWay: status?.onTheWayAt ?? order.onTheWayAt,
            delivered: status?.completedAt ?? order.completedAt,
            cancelled: status?.cancelledAt ?? order.cancelledAt,
          }}
        />
        <CourierTrackingPanel orderId={id} access={access} orderStatus={currentStatus} stages={stages} onOrderEnded={() => void refresh()} />
        <div className="border-t border-border pt-3">
          <CourierCard
            status={currentStatus}
            delivererName={status?.delivererName ?? order.delivererName}
            delivererPhotoUrl={status?.delivererPhotoUrl ?? order.delivererPhotoUrl}
          />
        </div>
      </section>

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
        {currentStatus === 'COMPLETED' && !isGuestAccess && (
          <Button fullWidth onClick={() => setReviewSheetOpen(true)}>
            Valorar pedido
          </Button>
        )}
        {access && (
          <Button fullWidth variant="outline" loading={refreshing} onClick={() => void refresh()}>
            Actualizar estado
          </Button>
        )}
        <Link to="/" className="flex min-h-12 items-center justify-center rounded-r-md bg-gradient-primary font-semibold text-white">
          Seguir comprando
        </Link>
      </div>

      <ReviewSheet
        open={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        state={reviews.state}
        loading={reviews.loading}
        loadError={reviews.error}
        submitting={reviews.submitting}
        onReload={reviews.reload}
        onSubmit={reviews.submit}
      />
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
