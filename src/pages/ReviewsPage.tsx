import { useCallback, useEffect, useState } from 'react'
import { listPendingReviews } from '../api/orderAccess'
import { ApiError } from '../api/ApiError'
import { AuthPrompt } from '../components/auth/AuthPrompt'
import { OrderRow } from '../components/orders/OrderRow'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import type { PendingReview } from '../types/backend/review'

/**
 * "Valoraciones" (`PendingReviewsScreen` de mobile): pedidos entregados recientes a los que
 * todavía les falta una valoración. Opcional, sin presión — solo entra quien quiere valorar.
 */
export function ReviewsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [pending, setPending] = useState<PendingReview[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      setPending(await listPendingReviews())
    } catch (err) {
      setError(true)
      if (!(err instanceof ApiError)) throw err
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) void load()
  }, [isAuthenticated, load])

  if (isLoading) {
    return (
      <div className="px-4 lg:px-0 pt-6">
        <RowsSkeleton rows={3} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="px-4 lg:px-0 pt-6 max-w-2xl mx-auto">
        <AuthPrompt title="Valora tus entregas" description="Con una cuenta puedes ver aquí los pedidos que aún puedes valorar." />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-h1 text-text-primary">Valoraciones</h1>

      {error && pending === null && (
        <div className="rounded-r-lg bg-surface-muted p-4 space-y-3">
          <p className="text-body text-text-primary">No pudimos cargar tus valoraciones.</p>
          <Button variant="outline" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      )}

      {pending === null && !error && <RowsSkeleton rows={3} />}

      {pending !== null && pending.length === 0 && (
        <EmptyState icon="star" title="Estás al día" description="No tienes entregas pendientes de valorar." />
      )}

      {pending !== null && pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map((item) => {
            const targets = [
              item.delivererPending ? `Mensajero ${item.delivererPending.delivererName}` : null,
              ...item.businessesPending.map((business) => business.businessName),
            ].filter(Boolean)
            return (
              <li key={item.orderId}>
                <OrderRow
                  to={`/pedido/${item.orderId}`}
                  orderNumber={item.orderNumber}
                  date={item.completedAt ?? new Date().toISOString()}
                  trailing={<span className="text-caption text-text-secondary text-right max-w-[9rem]">{targets.join(', ')}</span>}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
