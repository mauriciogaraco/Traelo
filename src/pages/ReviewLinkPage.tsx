import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { OrderAccess } from '../api/orderAccess'
import { ReviewSheet } from '../components/orders/ReviewSheet'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { reviewLinkView } from '../features/orders/reviewLink'
import { useAuth } from '../hooks/useAuth'
import { useOrderReviews } from '../hooks/useOrderReviews'
import { useOrderTracking } from '../hooks/useOrderTracking'
import { useGuestOrdersStore } from '../store/guestStore'

const linkClass = 'inline-flex min-h-12 items-center justify-center rounded-r-md px-4 font-semibold'
const primaryLink = `${linkClass} bg-gradient-primary text-white`
const outlineLink = `${linkClass} border border-primary text-primary-text hover:bg-primary/5`

/**
 * Enlace de reseña (`/valorar/<pedido>`): lo que el equipo o el mensajero le pasa al cliente para que valore su
 * entrega. La valoración exige cuenta y es del dueño del pedido: con sesión abre directo la valoración; sin sesión
 * invita a entrar y, al iniciar sesión, vuelve aquí. El enlace solo lleva el id del pedido, que no da acceso a nada:
 * quien lo abra con otra cuenta (o sin cuenta) no ve el pedido.
 */
export function ReviewLinkPage() {
  const { id = '' } = useParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const guestRef = useGuestOrdersStore((state) => state.orders.find((o) => o.orderId === id))
  const access = useMemo<OrderAccess | null>(() => (isAuthenticated ? { kind: 'customer' } : null), [isAuthenticated])

  const { order, status, loading: orderLoading, error, refresh, refreshing } = useOrderTracking(id, access)
  const currentStatus = status?.status ?? order?.status
  const reviews = useOrderReviews(id, access, currentStatus === 'COMPLETED')

  const view = reviewLinkView({
    authLoading,
    isAuthenticated,
    isGuestOrderHere: guestRef !== undefined,
    orderLoading: orderLoading || (access !== null && !order && error === null),
    hasOrder: order !== null,
    status: currentStatus,
    review: reviews.state ? { canReview: reviews.state.canReview, hasPending: reviews.state.hasPending } : null,
  })

  // La valoración se abre sola al llegar con algo por valorar (una vez); se puede cerrar y reabrir.
  const [sheetOpen, setSheetOpen] = useState(false)
  useEffect(() => {
    if (view === 'review') setSheetOpen(true)
  }, [view])

  if (view === 'loading') {
    return (
      <div className="px-4 pt-6 max-w-md mx-auto">
        <RowsSkeleton rows={3} />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 max-w-md mx-auto">
      {view === 'login' && (
        <>
          <EmptyState
            icon="star"
            title="Valora tu entrega"
            description="Inicia sesión con la cuenta con la que hiciste el pedido para valorarlo. Tu opinión ayuda a tu mensajero y a los negocios."
          />
          <div className="grid gap-3">
            <Link to="/login" className={primaryLink}>
              Iniciar sesión
            </Link>
            <Link to="/registro" className={outlineLink}>
              Crear cuenta
            </Link>
          </div>
        </>
      )}

      {view === 'guest-order' && (
        <>
          <EmptyState
            icon="star"
            title="Este pedido se hizo sin cuenta"
            description="Las valoraciones necesitan una cuenta, porque quedan ligadas a quien las hace. Crea una cuenta para valorar tus próximos pedidos."
          />
          <div className="grid gap-3">
            <Link to="/registro" className={primaryLink}>
              Crear cuenta
            </Link>
            <Link to="/login" className={outlineLink}>
              Ya tengo cuenta
            </Link>
          </div>
        </>
      )}

      {view === 'not-found' && (
        <>
          <EmptyState
            icon="receipt"
            title="No encontramos este pedido en tu cuenta"
            description="Entra con la cuenta con la que lo pediste. Si lo hiciste sin cuenta, no se puede valorar."
          />
          <div className="grid gap-3">
            <Link to="/pedidos" className={primaryLink}>
              Ver mis pedidos
            </Link>
          </div>
        </>
      )}

      {view === 'not-delivered' && (
        <>
          <EmptyState
            icon="receipt"
            title="Tu pedido todavía no se ha entregado"
            description="Cuando llegue podrás valorarlo desde este mismo enlace."
          />
          <div className="grid gap-3">
            <Button fullWidth loading={refreshing} onClick={() => void refresh()}>
              Actualizar estado
            </Button>
            <Link to={`/pedido/${id}`} className={outlineLink}>
              Ver mi pedido
            </Link>
          </div>
        </>
      )}

      {view === 'already-reviewed' && (
        <>
          <EmptyState icon="star" title="¡Gracias por tu valoración!" description="Ya valoraste este pedido. Tu opinión ayuda a mejorar el servicio." />
          <div className="grid gap-3">
            <Link to="/" className={primaryLink}>
              Seguir comprando
            </Link>
          </div>
        </>
      )}

      {view === 'review' && (
        <>
          <EmptyState icon="star" title="¿Cómo te fue con tu entrega?" description="Valora a tu mensajero y a los negocios. Solo toma un momento." />
          <div className="grid gap-3">
            <Button fullWidth onClick={() => setSheetOpen(true)}>
              Valorar ahora
            </Button>
          </div>
        </>
      )}

      <ReviewSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
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
