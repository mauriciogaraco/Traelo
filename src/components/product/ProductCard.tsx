import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { StockBadge } from '../ui/StockBadge'
import { ProductImage } from '../ui/ProductImage'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatAmount } from '../../lib/format'
import { hasFormato, hasOptions, packSize } from '../../lib/cart'
import { flyToCart } from '../../lib/flyToCart'

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addItem, getQuantity } = useCart()
  const qty = getQuantity(product.id)
  const isOut = product.stockStatus === 'agotado'
  const needsOption = hasOptions(product)

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (isOut) return
    // Con tipos: no se añade directo, se abre el detalle para elegir.
    if (needsOption) {
      navigate(`/producto/${product.id}`)
      return
    }
    flyToCart(e.currentTarget)
    addItem(product)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex flex-col h-full bg-surface rounded-3xl border border-border overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative">
        <ProductImage
          emoji={product.image}
          photo={product.photo}
          category={product.category}
          alt={product.name}
          size="md"
          className="w-full aspect-square"
        />
        <div className="absolute top-2 left-2">
          <StockBadge status={product.stockStatus} />
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3">
        <p className="text-[11px] font-semibold text-text-secondary truncate">
          {product.businessName}
        </p>
        {/* line-clamp-2: si el texto se sale, puntos suspensivos sin estirar la tarjeta */}
        <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2 mt-0.5">
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1">
          {hasFormato(product) && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
              Caja × {packSize(product)}
            </span>
          )}
          {needsOption && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-stone-100 text-text-secondary text-[10px] font-bold">
              {product.options!.length} tipos
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 mt-auto pt-3">
          <div className="leading-none min-w-0">
            <span className="text-base font-bold text-text-primary">
              {formatAmount(product.price)}
            </span>
            <span className="block text-[10px] font-semibold text-text-secondary mt-0.5">
              {hasFormato(product) ? 'CUP/u' : 'CUP'}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOut}
            aria-label={needsOption ? `Elegir tipo de ${product.name}` : `Añadir ${product.name}`}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
              isOut
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-gradient-primary text-white shadow-btn-primary hover:brightness-105'
            }`}
          >
            {needsOption ? (
              // icono "elegir": deslizadores/opciones
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            )}
            {qty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-text-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {qty}
              </span>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
