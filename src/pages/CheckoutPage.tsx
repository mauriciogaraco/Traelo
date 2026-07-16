import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useOrders } from '../context/OrdersContext'
import { useAddress } from '../context/AddressContext'
import { useToast } from '../context/ToastContext'
import { AddressBar } from '../components/address/AddressBar'
import { ProductImage } from '../components/ui/ProductImage'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { MessagingFeeRow } from '../components/ui/MessagingFeeRow'
import { PaymentNote } from '../components/ui/PaymentNote'
import { TimeWheel } from '../components/ui/TimeWheel'
import { formatAmount, formatPrice, formatTime12h } from '../lib/format'
import { makeOrder, groupByBusiness } from '../lib/order'
import { hasFormato, itemLineId, lineTotal, packSize, unitsOf } from '../lib/cart'
import { computeFee } from '../lib/fees'
import { isOpenNow, ordersClosedForToday } from '../lib/hours'
import { sendOrderToTelegram } from '../lib/telegram'
import { businessById } from '../data/catalog'

type DeliveryMode = 'asap' | 'scheduled'

function todayAt(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m || 0, 0, 0)
  return d
}

/**
 * Genera franjas de entrega de HOY, solo desde la hora actual en adelante
 * (en pasos de 15 min). value = "HH:mm" (24h, para el cálculo), label = "7:30 pm".
 */
function buildTimeSlots(now: Date, stepMin = 15): { value: string; label: string }[] {
  // Primera franja: redondea hacia adelante (nunca una hora ya pasada).
  const start = new Date(now)
  start.setSeconds(0, 0)
  const rem = now.getMinutes() % stepMin
  start.setMinutes(now.getMinutes() + (rem === 0 ? stepMin : stepMin - rem))

  const endOfDay = new Date(now)
  endOfDay.setHours(23, 45, 0, 0)

  const slots: { value: string; label: string }[] = []
  for (let t = new Date(start); t <= endOfDay; t.setMinutes(t.getMinutes() + stepMin)) {
    const hh = String(t.getHours()).padStart(2, '0')
    const mm = String(t.getMinutes()).padStart(2, '0')
    slots.push({ value: `${hh}:${mm}`, label: formatTime12h(`${hh}:${mm}`) })
  }
  return slots
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { saveOrder } = useOrders()
  const { address } = useAddress()
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('asap')
  const [deliveryTime, setDeliveryTime] = useState('')
  // Franjas de hoy desde la hora actual (se calculan una vez al abrir).
  const timeSlots = useMemo(() => buildTimeSlots(new Date()), [])

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <Header onBack={() => navigate('/')} />
        <EmptyState
          icon="🧾"
          title="No hay nada que confirmar"
          description="Tu carrito está vacío. Añade productos para hacer un pedido."
          action={<Button size="lg" onClick={() => navigate('/')}>Ir al inicio</Button>}
        />
      </div>
    )
  }

  const groups = groupByBusiness(items)
  const closedGroups = groups.filter((g) => {
    const b = businessById(g.businessId)
    return b ? !isOpenNow(b) : false
  })
  const hasUsdGroups = groups.some(g => businessById(g.businessId)?.currency === 'USD')
  const hasAnyUsd = hasUsdGroups || groups.some(g => g.items.some(i => i.product.currency === 'USD'))
  const hasClosed = closedGroups.length > 0

  // Entrega elegida → momento para calcular la tarifa
  const scheduledMissing = deliveryMode === 'scheduled' && !deliveryTime
  const when = deliveryMode === 'scheduled' && deliveryTime ? todayAt(deliveryTime) : new Date()
  const deliveryLabel =
    deliveryMode === 'scheduled' && deliveryTime
      ? `Hoy a las ${formatTime12h(deliveryTime)}`
      : 'Lo antes posible'

  const feeInfo = computeFee(items, when)
  const total = subtotal + feeInfo.fee
  const feeNote = [
    feeInfo.isLate ? 'después de las 7 pm' : null,
    feeInfo.multiBusiness ? '+100 por varios negocios' : null,
    feeInfo.isBulk ? '+100 por pedido mayor de 10 000 CUP' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const ordersClosed = ordersClosedForToday()
  const canConfirm = !!address && !sending && !hasClosed && !scheduledMissing && !ordersClosed

  async function confirm() {
    if (!canConfirm) return
    setSending(true)

    const order = makeOrder(items, address!, { label: deliveryLabel, when })
    const ok = await sendOrderToTelegram(order)

    if (ok) {
      saveOrder(order)
      clearCart()
      showToast('¡Pedido enviado! Te contactaremos pronto.', 'success')
      navigate('/pedidos', { replace: true, state: { justOrdered: order.id } })
    } else {
      setSending(false)
      showToast('No se pudo enviar el pedido. Inténtalo de nuevo.', 'error')
    }
  }

  return (
    <div className="animate-fade-in">
      <Header onBack={() => navigate(-1)} />

      <div className="px-4 space-y-5">
        {/* Dirección */}
        <section>
          <h2 className="text-sm font-bold text-text-primary mb-2">Dirección de entrega</h2>
          {address ? (
            <div className="bg-surface border border-border rounded-3xl p-4">
              <div className="min-w-0">
                <p className="font-bold text-text-primary">
                  {address.nombre} {address.apellidos}
                </p>
                <p className="text-sm text-text-secondary mt-0.5">{address.direccion}</p>
                {address.referencia && (
                  <p className="text-sm text-text-secondary mt-0.5">🧭 {address.referencia}</p>
                )}
                <p className="text-sm text-text-secondary mt-0.5">📞 {address.telefono}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <AddressBar />
              </div>
            </div>
          ) : (
            <>
              <AddressBar variant="card" />
              <p className="text-xs text-warning font-semibold mt-2">
                Agrega una dirección para poder confirmar tu pedido.
              </p>
            </>
          )}
        </section>

        {/* ¿Cuándo lo quieres? */}
        <section>
          <h2 className="text-sm font-bold text-text-primary mb-2">¿Cuándo lo quieres?</h2>
          <div className="bg-surface border border-border rounded-3xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryMode('asap')}
                className={`h-11 rounded-2xl text-sm font-bold border transition-all ${
                  deliveryMode === 'asap'
                    ? 'bg-gradient-primary text-white border-transparent shadow-btn-primary'
                    : 'bg-background text-text-primary border-border'
                }`}
              >
                Lo antes posible
              </button>
              <button
                onClick={() => {
                  setDeliveryMode('scheduled')
                  if (!deliveryTime && timeSlots[0]) setDeliveryTime(timeSlots[0].value)
                }}
                className={`h-11 rounded-2xl text-sm font-bold border transition-all ${
                  deliveryMode === 'scheduled'
                    ? 'bg-gradient-primary text-white border-transparent shadow-btn-primary'
                    : 'bg-background text-text-primary border-border'
                }`}
              >
                Elegir hora
              </button>
            </div>

            {deliveryMode === 'scheduled' &&
              (timeSlots.length === 0 ? (
                <p className="text-xs text-warning font-semibold px-1">
                  Ya no quedan horarios disponibles hoy. Elige “Lo antes posible”.
                </p>
              ) : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <p className="text-xs font-bold text-text-secondary text-center pt-2">
                    Hora de entrega (hoy)
                  </p>
                  <TimeWheel slots={timeSlots} value={deliveryTime} onChange={setDeliveryTime} />
                </div>
              ))}
            {feeInfo.isLate && (
              <p className="text-[11px] text-warning font-semibold">
                A partir de las 7:00 pm la mensajería cuesta {formatPrice(350)}.
              </p>
            )}
          </div>
        </section>

        {/* Resumen agrupado por negocio */}
        <section>
          <h2 className="text-sm font-bold text-text-primary mb-2">Resumen del pedido</h2>
          <div className="space-y-3">
            {groups.map((group) => {
              const groupCurrency = businessById(group.businessId)?.currency
              const grpUsd = group.items.filter(i => i.product.currency === 'USD' || groupCurrency === 'USD').reduce((s, i) => s + lineTotal(i), 0)
              const grpCup = group.items.filter(i => i.product.currency !== 'USD' && groupCurrency !== 'USD').reduce((s, i) => s + lineTotal(i), 0)
              const grpLabel = grpUsd > 0 && grpCup > 0
                ? `${formatPrice(grpCup)} + ${formatPrice(grpUsd, 'USD')}`
                : grpUsd > 0 ? formatPrice(grpUsd, 'USD') : formatPrice(grpCup)
              return (
                <div key={group.businessId} className="bg-surface border border-border rounded-3xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border">
                    <span className="text-primary">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1-5h16l1 5M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M3 9h18" />
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-text-primary flex-1 truncate">{group.businessName}</p>
                    <span className="text-xs font-semibold text-text-secondary">{grpLabel}</span>
                  </div>
                  {businessById(group.businessId)?.paymentNote && (
                    <PaymentNote note={businessById(group.businessId)!.paymentNote!} />
                  )}
                  <div className="p-3 space-y-3">
                    {group.items.map((item) => {
                      const itemCurrency = item.product.currency ?? groupCurrency
                      return (
                        <div key={itemLineId(item)} className="flex items-center gap-3">
                          <ProductImage emoji={item.product.image} photo={item.product.photo} category={item.product.category} alt={item.product.name} size="sm" className="w-11 h-11 rounded-xl flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary line-clamp-1">
                              {item.product.name}
                              {item.option && <span className="text-primary"> · {item.option}</span>}
                              {item.addon && <span className="text-success"> · + {item.addon.name}</span>}
                              {item.packaging && <span className="text-sky-700"> · 📦 {item.packaging.name}</span>}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {hasFormato(item.product)
                                ? `${unitsOf(item)} u · ${item.quantity} caja${item.quantity > 1 ? 's' : ''} × ${packSize(item.product)}`
                                : `× ${item.quantity}`}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-text-primary flex-shrink-0">
                            {itemCurrency === 'USD' ? '$ ' : ''}{formatAmount(lineTotal(item))}{itemCurrency === 'USD' ? ' USD' : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Totales */}
        <section className="bg-surface border border-border rounded-3xl p-4 space-y-3">
          {hasAnyUsd ? (
            <>
              {groups.map((group) => {
                const gc = businessById(group.businessId)?.currency
                const gUsd = group.items.filter(i => i.product.currency === 'USD' || gc === 'USD').reduce((s, i) => s + lineTotal(i), 0)
                const gCup = group.items.filter(i => i.product.currency !== 'USD' && gc !== 'USD').reduce((s, i) => s + lineTotal(i), 0)
                const gLabel = gUsd > 0 && gCup > 0
                  ? `${formatPrice(gCup)} + ${formatPrice(gUsd, 'USD')}`
                  : gUsd > 0 ? formatPrice(gUsd, 'USD') : formatPrice(gCup)
                return (
                  <div key={group.businessId} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{group.businessName}</span>
                    <span className="font-semibold text-text-primary">{gLabel}</span>
                  </div>
                )
              })}
              <div className="flex justify-between text-sm">
                <span className={deliveryMode === 'scheduled' ? 'font-bold text-warning' : 'text-text-secondary'}>
                  {deliveryMode === 'scheduled' ? '⚠️ ENTREGA' : 'Entrega'}
                </span>
                <span className={deliveryMode === 'scheduled' ? 'font-bold text-warning uppercase' : 'font-semibold text-text-primary'}>
                  {deliveryLabel}
                </span>
              </div>
              <MessagingFeeRow fee={feeInfo.fee} note={feeNote || undefined} />
              {hasUsdGroups && (
                <div className="border-t border-border pt-3">
                  <p className="text-[11px] text-warning font-semibold">
                    La mensajería se abona en CUP aunque no se retenga la prenda.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-semibold text-text-primary">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={deliveryMode === 'scheduled' ? 'font-bold text-warning' : 'text-text-secondary'}>
                  {deliveryMode === 'scheduled' ? '⚠️ ENTREGA' : 'Entrega'}
                </span>
                <span className={deliveryMode === 'scheduled' ? 'font-bold text-warning uppercase' : 'font-semibold text-text-primary'}>
                  {deliveryLabel}
                </span>
              </div>
              <MessagingFeeRow fee={feeInfo.fee} note={feeNote || undefined} />
              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-bold text-text-primary">Total a pagar</span>
                <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </>
          )}
        </section>

        {/* Negocio cerrado: no se puede pedir */}
        {hasClosed && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3">
            <span className="text-lg flex-shrink-0">🕒</span>
            <p className="text-xs text-red-800 leading-relaxed">
              <span className="font-bold">
                {closedGroups.map((g) => g.businessName).join(', ')}
              </span>{' '}
              está cerrado ahora. No puedes confirmar pedidos fuera del horario de atención. Vuelve
              dentro del horario o quita esos productos.
            </p>
          </div>
        )}

        {scheduledMissing && (
          <p className="text-xs text-warning font-semibold -mt-2">
            Elige la hora de entrega para continuar.
          </p>
        )}

        {/* Pedidos cerrados por hoy (después de las 9 pm) */}
        {ordersClosed && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <span className="text-lg flex-shrink-0">🌙</span>
            <p className="text-xs text-amber-900 leading-relaxed">
              Ya terminamos de tomar encargos por hoy. Las mensajerías pendientes se entregarán.
              Vuelve mañana a partir de las 9:00 am para confirmar tu pedido.
            </p>
          </div>
        )}

        {/* Aviso */}
        <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-2xl p-3">
          <span className="text-lg flex-shrink-0">📨</span>
          <p className="text-xs text-sky-900 leading-relaxed">
            Al confirmar, tu pedido se envía directo a Tráelo. Te contactaremos por teléfono para
            coordinar la entrega. El pago se realiza al recibir.
          </p>
        </div>

        <Button size="lg" fullWidth disabled={!canConfirm} onClick={confirm}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.7 3.3 2.5 11.1c-.9.4-.9 1.6 0 1.9l4.8 1.6 1.8 5.8c.2.7 1.1.9 1.6.3l2.7-2.9 4.7 3.4c.6.4 1.5.1 1.7-.6l3.4-15.6c.2-1-.8-1.9-1.5-1.7Z" />
          </svg>
          {sending ? 'Enviando pedido...' : ordersClosed ? 'Pedidos cerrados por hoy' : 'Confirmar pedido'}
        </Button>
      </div>
    </div>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="px-4 pt-6 pb-4 flex items-center gap-3">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-primary"
        aria-label="Volver"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="text-2xl font-bold text-text-primary">Confirmar pedido</h1>
    </header>
  )
}
