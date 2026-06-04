import { useState } from 'react'
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
import { formatAmount, formatPrice } from '../lib/format'
import { makeOrder, groupByBusiness } from '../lib/order'
import { hasFormato, lineTotal, packSize, unitsOf } from '../lib/cart'
import { sendOrderToTelegram } from '../lib/telegram'
import { businessById } from '../data/catalog'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCart()
  const { saveOrder } = useOrders()
  const { address } = useAddress()
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)

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

  async function confirm() {
    if (!address || sending) return
    setSending(true)

    const order = makeOrder(items, address)
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

        {/* Resumen agrupado por negocio */}
        <section>
          <h2 className="text-sm font-bold text-text-primary mb-2">Resumen del pedido</h2>
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.businessId} className="bg-surface border border-border rounded-3xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border">
                  <span className="text-primary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1-5h16l1 5M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M3 9h18" />
                    </svg>
                  </span>
                  <p className="text-sm font-bold text-text-primary flex-1 truncate">{group.businessName}</p>
                  <span className="text-xs font-semibold text-text-secondary">{formatPrice(group.subtotal)}</span>
                </div>
                {businessById(group.businessId)?.paymentNote && (
                  <PaymentNote note={businessById(group.businessId)!.paymentNote!} />
                )}
                <div className="p-3 space-y-3">
                  {group.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <ProductImage emoji={item.product.image} photo={item.product.photo} category={item.product.category} alt={item.product.name} size="sm" className="w-11 h-11 rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-text-secondary">
                          {hasFormato(item.product)
                            ? `${unitsOf(item)} u · ${item.quantity} caja${item.quantity > 1 ? 's' : ''} × ${packSize(item.product)}`
                            : `× ${item.quantity}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-text-primary flex-shrink-0">
                        {formatAmount(lineTotal(item))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Totales */}
        <section className="bg-surface border border-border rounded-3xl p-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-semibold text-text-primary">{formatPrice(total)}</span>
          </div>
          <MessagingFeeRow />
          <div className="border-t border-border pt-2.5 flex justify-between items-baseline">
            <span className="font-bold text-text-primary">Total a pagar</span>
            <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </section>

        {/* Aviso */}
        <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-2xl p-3">
          <span className="text-lg flex-shrink-0">📨</span>
          <p className="text-xs text-sky-900 leading-relaxed">
            Al confirmar, tu pedido se envía directo a Tráelo. Te contactaremos por teléfono para
            coordinar la entrega. El pago se realiza al recibir.
          </p>
        </div>

        <Button size="lg" fullWidth disabled={!address || sending} onClick={confirm}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.7 3.3 2.5 11.1c-.9.4-.9 1.6 0 1.9l4.8 1.6 1.8 5.8c.2.7 1.1.9 1.6.3l2.7-2.9 4.7 3.4c.6.4 1.5.1 1.7-.6l3.4-15.6c.2-1-.8-1.9-1.5-1.7Z" />
          </svg>
          {sending ? 'Enviando pedido...' : 'Confirmar pedido'}
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
