import { MESSAGING_FEE, MESSAGING_FREE } from '../../lib/config'
import { formatPrice } from '../../lib/format'

/** Fila de "Mensajería" con la tarifa tachada y el "Gratis" del lanzamiento. */
export function MessagingFeeRow() {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-text-secondary flex items-center gap-1.5">
        <span aria-hidden="true">🛵</span> Mensajería
      </span>
      {MESSAGING_FREE ? (
        <span className="flex items-center gap-2">
          <span className="text-text-secondary line-through">{formatPrice(MESSAGING_FEE)}</span>
          <span className="px-2 py-0.5 rounded-full bg-green-50 text-success text-xs font-bold">
            Gratis
          </span>
        </span>
      ) : (
        <span className="font-semibold text-text-primary">{formatPrice(MESSAGING_FEE)}</span>
      )}
    </div>
  )
}
