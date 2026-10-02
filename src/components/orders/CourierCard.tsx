import { getCourierView } from '../../features/orders/tracking'
import { Icon } from '../ui/Icon'

/**
 * "Buscando mensajero…" / "Tu mensajero: X" / "Entregado por X". Lo que dice depende solo del
 * estado real y de si el backend ya entregó un nombre; en un pedido cancelado no se muestra.
 * Con nombre se muestra su foto (o su inicial si no tiene).
 */
export function CourierCard({
  status,
  delivererName,
  delivererPhotoUrl,
}: {
  status: string | null | undefined
  delivererName: string | null | undefined
  delivererPhotoUrl?: string | null
}) {
  const view = getCourierView(status, delivererName)
  if (view.kind === 'none') return null

  const name = view.kind === 'assigned' || view.kind === 'delivered' ? view.name : null

  let leading
  if (view.kind === 'searching') {
    leading = (
      <span className="w-11 h-11 shrink-0 rounded-full bg-primary-soft flex items-center justify-center" aria-hidden="true">
        <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" />
      </span>
    )
  } else if (name && delivererPhotoUrl) {
    leading = (
      <img
        src={delivererPhotoUrl}
        alt={`Foto de ${name}`}
        width={46}
        height={46}
        loading="lazy"
        className="w-[46px] h-[46px] shrink-0 rounded-full object-cover"
        data-testid="courier-photo"
      />
    )
  } else if (name) {
    leading = (
      <span
        aria-hidden="true"
        data-testid="courier-initial"
        className="w-[46px] h-[46px] shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center text-h3"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  } else {
    leading = (
      <span className="w-11 h-11 shrink-0 rounded-full bg-primary-soft text-primary flex items-center justify-center" aria-hidden="true">
        <Icon name={view.kind === 'delivered' ? 'star' : 'receipt'} size={22} />
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3" data-testid="courier-card">
      {leading}
      <p className="text-body font-semibold text-text-primary">{view.text}</p>
    </div>
  )
}
