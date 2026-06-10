import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOrders } from '../context/OrdersContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDate, formatPrice } from '../lib/format'
import { groupByBusiness } from '../lib/order'
import { hasFormato, itemLineId, lineTotal, unitsOf } from '../lib/cart'
import { sendOrderToTelegram } from '../lib/telegram'
import type { Order } from '../types'

const statusConfig = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-50 text-warning' },
  completado: { label: 'Completado', className: 'bg-green-50 text-success' },
}

export function OrdersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orders, markCompleted } = useOrders()
  const justOrdered = (location.state as { justOrdered?: string } | null)?.justOrdered

  if (orders.length === 0) {
    return (
      <div className="animate-fade-in">
        <header className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-text-primary">Mis pedidos</h1>
        </header>
        <EmptyState
          icon="📦"
          title="Aún no tienes pedidos"
          description="Cuando hagas tu primer pedido aparecerá aquí para que le hagas seguimiento."
          action={<Button size="lg" onClick={() => navigate('/')}>Empezar a comprar</Button>}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">Mis pedidos</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </p>
      </header>

      {justOrdered && (
        <div className="mx-4 mb-4 flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-2xl p-3 animate-scale-in">
          <span className="text-lg">✅</span>
          <p className="text-sm font-semibold text-green-800">
            ¡Pedido #{justOrdered} enviado! Te contactaremos para coordinar la entrega.
          </p>
        </div>
      )}

      <div className="px-4 space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onComplete={() => markCompleted(order.id)} />
        ))}
      </div>
    </div>
  )
}

function OrderCard({ order, onComplete }: { order: Order; onComplete: () => void }) {
  const { showToast } = useToast()
  const [resending, setResending] = useState(false)
  const status = statusConfig[order.status]
  const groups = groupByBusiness(order.items)

  async function resend() {
    if (resending) return
    setResending(true)
    const ok = await sendOrderToTelegram(order)
    setResending(false)
    showToast(
      ok ? 'Pedido reenviado correctamente.' : 'No se pudo reenviar. Inténtalo de nuevo.',
      ok ? 'success' : 'error'
    )
  }

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
        <div>
          <p className="text-[11px] font-semibold text-text-secondary">Pedido</p>
          <p className="text-lg font-bold text-text-primary">#{order.id}</p>
          <p className="text-xs text-text-secondary mt-0.5">{formatDate(order.date)}</p>
          {order.delivery && (
            <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
              </svg>
              {order.delivery}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Items agrupados por negocio */}
      <div className="px-4 py-3 space-y-3">
        {groups.map((group) => (
          <div key={group.businessId}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-1.5">
              <span className="text-primary" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1-5h16l1 5M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M3 9h18" />
                </svg>
              </span>
              {group.businessName}
            </p>
            <div className="space-y-1 pl-1">
              {group.items.map((item) => (
                <div key={itemLineId(item)} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text-secondary line-clamp-1 flex-1">
                    {item.product.name}
                    {item.option && <span className="text-primary font-semibold"> · {item.option}</span>}{' '}
                    <span className="text-text-secondary/70">
                      × {hasFormato(item.product) ? `${unitsOf(item)} u` : item.quantity}
                    </span>
                  </span>
                  <span className="font-semibold text-text-primary flex-shrink-0">
                    {formatPrice(lineTotal(item))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 pt-1 border-t border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-text-secondary">Total</p>
          <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resend}
            disabled={resending}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 disabled:opacity-60 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.7 3.3 2.5 11.1c-.9.4-.9 1.6 0 1.9l4.8 1.6 1.8 5.8c.2.7 1.1.9 1.6.3l2.7-2.9 4.7 3.4c.6.4 1.5.1 1.7-.6l3.4-15.6c.2-1-.8-1.9-1.5-1.7Z" />
            </svg>
            {resending ? 'Enviando…' : 'Reenviar'}
          </button>
          {order.status === 'pendiente' && (
            <button
              onClick={onComplete}
              className="h-9 px-3 rounded-xl border border-border text-xs font-bold text-text-primary hover:border-primary/40 transition-colors"
            >
              Recibido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
