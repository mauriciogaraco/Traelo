import { useState } from 'react'
import {
  canAddUnit,
  estimateAllProductsInPoints,
  estimatePointsCost,
  lineIdOf,
  payAllWithPoints,
  unitPointsEstimate,
  unitsForLine,
  type PointsUnits,
} from '../../features/cart'
import type { CartItem } from '../../store/cartStore'

type Props = {
  items: CartItem[]
  /** Saldo de puntos (lo trae el servidor; aquí solo se muestra y se usa para no pasarse). */
  balance: number
  units: PointsUnits
  onChangeLine: (lineId: string, units: number) => void
  onChangeAll: (units: PointsUnits) => void
  /** Con una recompensa aplicada no se puede pagar con puntos a la vez (el servidor lo rechaza). */
  blockedByReward: boolean
}

const points = (value: number) => `${Math.round(value).toLocaleString('es')} ${Math.round(value) === 1 ? 'punto' : 'puntos'}`

/**
 * "Pagar con puntos" en el checkout: un interruptor que, al activarse, despliega por cada línea cuántas
 * unidades se pagan con puntos (un producto se paga COMPLETO; el pedido puede pagarse en parte). Solo
 * aparece si hay saldo y al menos un producto del carrito que los puntos alcancen a pagar. Los puntos no
 * cubren mensajería, Servicio Tráelo ni envase. Los números son estimados; el servidor confirma los exactos.
 */
export function PointsPaymentSection({ items, balance, units, onChangeLine, onChangeAll, blockedByReward }: Props) {
  const [expanded, setExpanded] = useState(false)

  const payable =
    balance > 0 &&
    items.some((item) => {
      const unit = unitPointsEstimate(item)
      return unit > 0 && unit <= balance
    })
  if (!payable) return null

  if (blockedByReward) {
    return (
      <section className="rounded-r-md bg-gold-soft p-3 space-y-1" data-testid="points-payment-blocked">
        <h2 className="text-[15px] font-bold text-text-primary">⭐ Pagar con puntos</h2>
        <p className="text-caption text-text-secondary">Ya usaste una recompensa en este pedido: no se puede pagar con puntos a la vez.</p>
      </section>
    )
  }

  const cost = estimatePointsCost(items, units)
  const allCost = estimateAllProductsInPoints(items)
  const canPayAll = allCost > 0 && allCost <= balance
  const using = Object.keys(units).length > 0
  const open = expanded || using

  const toggle = () => {
    const next = !open
    setExpanded(next)
    if (!next) onChangeAll({})
  }

  return (
    <section className="rounded-r-md bg-gold-soft p-3 space-y-3" data-testid="points-payment">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-text-primary">⭐ Pagar con puntos</h2>
          <p className="text-caption text-text-secondary">Tienes {points(balance)}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          aria-label="Pagar con puntos"
          data-testid="points-switch"
          onClick={toggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
            open ? 'bg-primary' : 'bg-surface border border-border'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${open ? 'left-[22px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      {open && (
        <div className="space-y-3" data-testid="points-body">
          <p className="text-caption text-text-secondary">Cada producto se paga completo. No cubren mensajería ni Servicio Tráelo.</p>

          {items.map((item) => {
            const lineId = lineIdOf(item)
            const chosen = unitsForLine(item, units)
            const unit = unitPointsEstimate(item)
            if (unit <= 0 || unit > balance) return null
            const plusOk = canAddUnit(item, units, items, balance)
            return (
              <div key={lineId} className="flex items-center gap-3" data-testid={`points-line-${lineId}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-text-primary line-clamp-2">{item.nameSnapshot}</p>
                  <p className="text-caption text-text-secondary">
                    {points(unit)} c/u · {chosen} de {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeLine(lineId, chosen - 1)}
                    disabled={chosen === 0}
                    aria-label={`Pagar una unidad menos de ${item.nameSnapshot} con puntos`}
                    data-testid={`points-minus-${lineId}`}
                    className="h-8 w-8 rounded-full bg-surface text-primary-text text-lg font-bold leading-none disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-[15px] font-bold text-text-primary">{chosen}</span>
                  <button
                    type="button"
                    onClick={() => onChangeLine(lineId, chosen + 1)}
                    disabled={!plusOk}
                    aria-label={`Pagar una unidad más de ${item.nameSnapshot} con puntos`}
                    data-testid={`points-plus-${lineId}`}
                    className="h-8 w-8 rounded-full bg-surface text-primary-text text-lg font-bold leading-none disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => onChangeAll(payAllWithPoints(items, balance))}
            data-testid="points-pay-all"
            className="min-h-11 w-full rounded-r-md border border-primary bg-surface px-3 py-2 text-center text-body-sm font-semibold text-primary-text hover:bg-primary/5"
          >
            Pagar todos los productos con puntos
          </button>
          {!canPayAll && (
            <p className="text-caption text-text-secondary" data-testid="points-partial-hint">
              Tus puntos no alcanzan para todos los productos ({points(allCost)}): se pagan con puntos los que alcancen y el resto en efectivo.
            </p>
          )}
          {using && (
            <p className="text-caption text-gold-text" data-testid="points-estimate">
              Estimado: usarás {points(cost)} y te quedarán {points(Math.max(balance - cost, 0))}. El total exacto lo confirma Tráelo abajo.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
