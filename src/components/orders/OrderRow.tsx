import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

/** Fila de la lista de pedidos: ícono, "Pedido #N", fecha y, a la derecha, el estado o un chevron. */
export function OrderRow({
  to,
  orderNumber,
  date,
  trailing,
}: {
  to: string
  orderNumber: number | string
  date: string
  trailing?: ReactNode
}) {
  return (
    <Link
      to={to}
      aria-label={`Pedido ${orderNumber}`}
      className="flex items-center gap-3 rounded-r-lg bg-surface border border-border/60 shadow-card p-3 hover:shadow-card-hover transition"
    >
      <span className="w-11 h-11 shrink-0 rounded-full bg-primary-soft text-primary flex items-center justify-center">
        <Icon name="receipt" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-text-primary">Pedido #{orderNumber}</span>
        <span className="block text-caption text-text-secondary">
          {new Date(date).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </span>
      {trailing ?? <Icon name="chevron-right" size={18} className="text-text-tertiary" />}
    </Link>
  )
}
