import { useEffect, useState } from 'react'
import type { ReviewSubmission, SubmitReviewsOutcome } from '../../services/reviewsService'
import type { OrderReviewState } from '../../types/backend/review'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { StarRating } from './StarRating'

const COMMENT_MAX_LENGTH = 500

type Props = {
  open: boolean
  /** "Ahora no" y cerrar: nunca bloquea nada, la valoración es siempre opcional. */
  onClose: () => void
  state: OrderReviewState | null
  loading: boolean
  loadError: 'offline' | 'error' | null
  submitting: boolean
  onReload: () => void
  onSubmit: (submission: ReviewSubmission) => Promise<SubmitReviewsOutcome>
}

/**
 * "¿Cómo fue tu experiencia?": valorar al mensajero y a cada negocio del pedido con estrellas
 * (1.0–5.0, paso 0.1). Es opcional y se puede posponer. Qué falta valorar lo dice el backend
 * (`state`); un fallo de red conserva lo elegido y permite reintentar.
 */
export function ReviewSheet({ open, onClose, state, loadError, submitting, onReload, onSubmit }: Props) {
  const { showToast } = useToast()
  const [delivererRating, setDelivererRating] = useState<number | null>(null)
  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitError, setSubmitError] = useState<{ message: string; retryable: boolean } | null>(null)
  const [thanks, setThanks] = useState(false)

  // Cada vez que se abre para otro pedido/estado se empieza limpio.
  useEffect(() => {
    if (open) {
      setDelivererRating(null)
      setBusinessRatings({})
      setComment('')
      setSubmitError(null)
      setThanks(false)
    }
  }, [open, state?.orderId])

  const pendingDeliverer = state?.deliverer?.status === 'pending' ? state.deliverer : null
  const pendingBusinesses = state?.businesses.filter((business) => business.status === 'pending') ?? []
  const hasSelection =
    (pendingDeliverer !== null && delivererRating !== null) ||
    Object.keys(businessRatings).length > 0 ||
    comment.trim().length > 0

  async function handleSubmit() {
    setSubmitError(null)
    const outcome = await onSubmit({
      deliverer: pendingDeliverer && delivererRating !== null ? delivererRating : undefined,
      businesses: pendingBusinesses
        .filter((business) => businessRatings[business.businessId] !== undefined)
        .map((business) => ({ businessId: business.businessId, rating: businessRatings[business.businessId] as number })),
      comment: comment.trim() || undefined,
    })
    if (outcome.ok) {
      setThanks(true)
      showToast('¡Gracias por tu valoración!', 'success')
    } else {
      setSubmitError({ message: outcome.message, retryable: outcome.retryable })
      showToast(`No pudimos enviar tu valoración. ${outcome.message}`, 'error')
    }
  }

  function renderBody() {
    if (!state) {
      if (loadError) {
        return (
          <div className="space-y-3">
            <p className="text-body text-text-primary" data-testid="review-load-error">
              {loadError === 'offline'
                ? 'Sin conexión. Conéctate a Internet para valorar tu pedido.'
                : 'No pudimos cargar tu valoración.'}
            </p>
            <Button variant="outline" fullWidth onClick={onReload}>
              Reintentar
            </Button>
          </div>
        )
      }
      return (
        <div role="status" data-testid="review-loading" className="flex justify-center py-6">
          <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" />
        </div>
      )
    }

    if (!state.canReview) return <p className="text-body text-text-primary">Podrás valorar cuando tu pedido esté entregado.</p>

    if (thanks || !state.hasPending) {
      return (
        <div className="space-y-1 py-4 text-center" data-testid="review-thanks">
          <p className="text-h3 text-text-primary">¡Gracias por tu valoración!</p>
          <p className="text-caption text-text-secondary">Nos ayuda a mejorar el servicio.</p>
        </div>
      )
    }

    return (
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (hasSelection && !submitting) void handleSubmit()
        }}
      >
        {pendingDeliverer && (
          <div className="space-y-1" data-testid="review-deliverer">
            <p className="font-semibold text-text-primary">Tu mensajero: {pendingDeliverer.delivererName}</p>
            <StarRating
              value={delivererRating}
              onChange={setDelivererRating}
              label={`Valoración del mensajero ${pendingDeliverer.delivererName}`}
            />
          </div>
        )}

        {pendingBusinesses.map((business) => (
          <div key={business.businessId} className="space-y-1" data-testid={`review-business-${business.businessId}`}>
            <p className="font-semibold text-text-primary">{business.businessName}</p>
            <StarRating
              value={businessRatings[business.businessId] ?? null}
              onChange={(rating) => setBusinessRatings((current) => ({ ...current, [business.businessId]: rating }))}
              label={`Valoración de ${business.businessName}`}
            />
          </div>
        ))}

        <label className="block">
          <span className="block mb-1 text-label text-text-secondary">¿Algo que quieras contarnos? (opcional)</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, COMMENT_MAX_LENGTH))}
            maxLength={COMMENT_MAX_LENGTH}
            rows={3}
            data-testid="review-comment"
            className="w-full rounded-r-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
          />
        </label>

        {submitError && (
          <p role="alert" className="text-caption text-danger-text" data-testid="review-submit-error">
            {submitError.message}
          </p>
        )}

        <Button type="submit" fullWidth loading={submitting} disabled={!hasSelection}>
          {submitError?.retryable ? 'Reintentar' : 'Enviar valoración'}
        </Button>
      </form>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title="¿Cómo fue tu experiencia?">
      {renderBody()}
      <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-caption font-semibold text-text-secondary">
        Ahora no
      </button>
    </Sheet>
  )
}
