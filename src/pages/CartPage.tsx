import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ProductImage } from '../components/ui/ProductImage'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { MessagingFeeRow } from '../components/ui/MessagingFeeRow'
import { PaymentNote } from '../components/ui/PaymentNote'
import { formatAmount, formatPrice } from '../lib/format'
import { groupByBusiness } from '../lib/order'
import { hasFormato, itemLineId, lineTotal, packSize, unitsOf } from '../lib/cart'
import { businessById } from '../data/catalog'
import type { CartItem } from '../types'

export function CartPage() {
  const navigate = useNavigate()
  const { items, setQuantity, removeItem, subtotal, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Tu carrito" />
        <EmptyState
          icon="🛒"
          title="Tu carrito está vacío"
          description="Busca productos y añádelos para empezar tu pedido."
          action={<Button size="lg" onClick={() => navigate('/')}>Explorar productos</Button>}
        />
      </div>
    )
  }

  const groups = groupByBusiness(items)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tu carrito"
        subtitle={`${items.length} ${items.length === 1 ? 'producto' : 'productos'} · ${groups.length} ${groups.length === 1 ? 'negocio' : 'negocios'}`}
      />

      <div className="px-4 space-y-4">
        {groups.map((group) => (
          <div key={group.businessId} className="bg-surface border border-border rounded-3xl overflow-hidden">
            {/* Cabecera del negocio */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border">
              <span className="text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
              {group.items.map((item) => {
                const key = itemLineId(item)
                return (
                  <CartRow
                    key={key}
                    item={item}
                    onDec={() => setQuantity(key, item.quantity - 1)}
                    onInc={() => setQuantity(key, item.quantity + 1)}
                    onRemove={() => removeItem(key)}
                    onOpen={() => navigate(`/producto/${item.product.id}`)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="px-4 mt-5">
        <div className="bg-surface border border-border rounded-3xl p-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-semibold text-text-primary">{formatPrice(subtotal)}</span>
          </div>
          <MessagingFeeRow />
          <div className="border-t border-border pt-2.5 flex justify-between items-baseline">
            <span className="font-bold text-text-primary">Total</span>
            <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="mt-4">
          <Button size="lg" fullWidth onClick={() => navigate('/checkout')}>
            Continuar al pedido
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}

function CartRow({
  item,
  onDec,
  onInc,
  onRemove,
  onOpen,
}: {
  item: CartItem
  onDec: () => void
  onInc: () => void
  onRemove: () => void
  onOpen: () => void
}) {
  const { product } = item
  return (
    <div className="flex gap-3">
      <button onClick={onOpen} className="flex-shrink-0">
        <ProductImage emoji={product.image} photo={product.photo} category={product.category} alt={product.name} size="sm" className="w-20 h-20 rounded-2xl" />
      </button>

      <div className="flex-1 min-w-0 flex flex-col">
        <button
          onClick={onOpen}
          className="text-sm font-bold text-text-primary leading-snug line-clamp-2 text-left"
        >
          {product.name}
        </button>
        {item.option && (
          <span className="inline-flex self-start items-center mt-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
            {item.option}
          </span>
        )}
        {hasFormato(product) && (
          <p className="text-[11px] font-semibold text-text-secondary mt-0.5">
            {unitsOf(item)} u · caja × {packSize(product)} · {formatAmount(product.price)}/u
          </p>
        )}
        <p className="text-base font-bold text-primary mt-auto">
          {formatAmount(lineTotal(item))}{' '}
          <span className="text-[11px] font-semibold text-text-secondary">CUP</span>
        </p>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 flex items-center justify-center transition-colors"
          aria-label="Eliminar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0-.7 12a1 1 0 0 1-1 .94H8.7a1 1 0 0 1-1-.94L7 7" />
          </svg>
        </button>

        <div className="flex items-center bg-background border border-border rounded-xl">
          <button onClick={onDec} className="w-8 h-8 flex items-center justify-center text-text-primary" aria-label="Disminuir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M5 12h14" />
            </svg>
          </button>
          <span className="min-w-9 px-1 text-center text-sm font-bold">{unitsOf(item)}</span>
          <button onClick={onInc} className="w-8 h-8 flex items-center justify-center text-primary" aria-label={hasFormato(product) ? 'Añadir una caja' : 'Aumentar'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
    </header>
  )
}
