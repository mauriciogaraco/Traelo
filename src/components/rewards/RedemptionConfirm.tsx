import { formatCup } from '../catalog/Price'
import { formatPoints } from '../../features/rewards'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import type { OrderQuote } from '../../types/backend/rewards'

type Props = {
  open: boolean
  /** Cotización calculada por el SERVIDOR: todas las cifras salen de ella, la web no calcula nada. */
  quote: OrderQuote | null
  onConfirm: () => void
  onCancel: () => void
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-bold text-text-primary text-base' : 'text-body text-text-primary'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

/** "¿Usar 300 puntos para obtener Pizza Especial?" con el antes/después de puntos y del pedido. */
export function RedemptionConfirm({ open, quote, onConfirm, onCancel }: Props) {
  const redemption = quote?.redemption ?? null
  if (!quote || !redemption) return null

  return (
    <Sheet open={open} onClose={onCancel} title={`¿Usar ${formatPoints(redemption.pointsCost)} para obtener ${redemption.rewardName}?`}>
      <div className="space-y-3">
        <div>
          <p className="text-caption text-text-secondary">Tus puntos</p>
          <p className="font-semibold text-text-primary" data-testid="confirm-points">
            {redemption.balanceBefore.toLocaleString('es')} → {redemption.balanceAfter.toLocaleString('es')}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-secondary">Productos</p>
          <p className="font-semibold text-text-primary" data-testid="confirm-products">
            {formatCup(quote.productsTotal)} → {formatCup(quote.productsToPay)}
          </p>
        </div>

        <div className="border-t border-border pt-2 space-y-1">
          <Row label="Mensajería" value={formatCup(quote.deliveryFee)} />
          <Row label="Servicio Tráelo" value={formatCup(quote.platformFee)} />
          <Row label="Total" value={formatCup(quote.total)} strong />
        </div>
        <p className="text-caption text-text-secondary">
          Los puntos se descuentan cuando confirmas el pedido. La mensajería y el servicio no se pagan con puntos.
        </p>

        <div className="space-y-2 pt-1">
          <Button fullWidth onClick={onConfirm}>
            Confirmar canje
          </Button>
          <Button fullWidth variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
