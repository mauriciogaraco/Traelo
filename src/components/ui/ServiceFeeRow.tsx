import { formatPrice } from '../../lib/format'

/** Fila de "Servicio Tráelo" (comisiones redondeadas al múltiplo de 10 superior). */
export function ServiceFeeRow({ fee }: { fee: number }) {
  if (fee <= 0) return null
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-text-secondary flex items-center gap-1.5">
        <span aria-hidden="true">🧾</span> Servicio Tráelo
      </span>
      <span className="font-semibold text-text-primary">{formatPrice(fee)}</span>
    </div>
  )
}
