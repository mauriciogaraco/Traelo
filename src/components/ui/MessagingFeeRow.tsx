import { formatPrice } from '../../lib/format'

/** Fila de "Mensajería" con la tarifa calculada (y una nota opcional del porqué). */
export function MessagingFeeRow({ fee, note }: { fee: number; note?: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-text-secondary flex items-center gap-1.5">
        <span aria-hidden="true">🛵</span> Mensajería
      </span>
      <span className="text-right">
        <span className="font-semibold text-text-primary">
          {fee === 0 ? 'Gratis 🎉' : formatPrice(fee)}
        </span>
        {note && <span className="block text-[11px] text-text-secondary">{note}</span>}
      </span>
    </div>
  )
}
