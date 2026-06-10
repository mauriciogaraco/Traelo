import { MESSAGING_PROMO } from '../../lib/config'
import { formatPrice } from '../../lib/format'

/** Fila de "Mensajería" con la tarifa calculada (y una nota opcional del porqué). */
export function MessagingFeeRow({ fee, note }: { fee: number; note?: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-text-secondary flex items-center gap-1.5">
        <span aria-hidden="true">🛵</span> Mensajería
      </span>
      <span className="text-right">
        <span className="font-semibold text-text-primary">{formatPrice(fee)}</span>
        {note && <span className="block text-[11px] text-text-secondary">{note}</span>}
      </span>
    </div>
  )
}

/** Banner de la promoción de lanzamiento. */
export function MessagingPromo() {
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-3 py-2.5">
      <span className="text-base flex-shrink-0" aria-hidden="true">🎁</span>
      <p className="text-xs font-bold text-green-800 leading-snug">{MESSAGING_PROMO}</p>
    </div>
  )
}
