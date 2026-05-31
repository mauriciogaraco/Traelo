import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useOrders } from '../context/OrdersContext'
import { useAddress } from '../context/AddressContext'
import { AddressBar } from '../components/address/AddressBar'
import { ProductImage } from '../components/ui/ProductImage'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatAmount, formatPrice } from '../lib/format'
import { buildWhatsAppUrl } from '../lib/whatsapp'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { address } = useAddress()
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

  function confirm() {
    if (!address || sending) return
    setSending(true)
    const order = createOrder(items, address)
    const url = buildWhatsAppUrl(order)
    clearCart()
    // Abrir WhatsApp con el pedido pre-cargado
    window.open(url, '_blank', 'noopener,noreferrer')
    navigate('/pedidos', { replace: true, state: { justOrdered: order.id } })
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-text-primary">
                    {address.nombre} {address.apellidos}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">{address.direccion}</p>
                  <p className="text-sm text-text-secondary mt-0.5">📞 {address.telefono}</p>
                </div>
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

        {/* Resumen */}
        <section>
          <h2 className="text-sm font-bold text-text-primary mb-2">Resumen del pedido</h2>
          <div className="bg-surface border border-border rounded-3xl p-4 space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <ProductImage emoji={product.image} photo={product.photo} category={product.category} alt={product.name} size="sm" className="w-11 h-11 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary line-clamp-1">{product.name}</p>
                  <p className="text-xs text-text-secondary">x {quantity}</p>
                </div>
                <p className="text-sm font-bold text-text-primary flex-shrink-0">
                  {formatAmount(product.price * quantity)}
                </p>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between items-baseline">
              <span className="font-bold text-text-primary">Total a pagar</span>
              <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* Aviso */}
        <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-2xl p-3">
          <span className="text-lg flex-shrink-0">💬</span>
          <p className="text-xs text-green-800 leading-relaxed">
            Al confirmar, abriremos WhatsApp con tu pedido listo para enviar al negocio. El pago se
            coordina en la entrega.
          </p>
        </div>

        <Button size="lg" fullWidth disabled={!address || sending} onClick={confirm}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1-.7.9-.9 1.1-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.5a1 1 0 0 0-.8.4 3 3 0 0 0-1 2.2 5.3 5.3 0 0 0 1.2 2.8 12 12 0 0 0 4.6 4c.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3Z" />
            <path fillRule="evenodd" d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2Zm0 18.3a8.3 8.3 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.3 8.3 0 1 1 12 20.3Z" clipRule="evenodd" />
          </svg>
          {sending ? 'Abriendo WhatsApp...' : 'Confirmar pedido'}
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
