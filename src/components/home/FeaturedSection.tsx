import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '../../types'
import { ProductImage } from '../ui/ProductImage'
import { useCart } from '../../context/CartContext'
import { formatAmount } from '../../lib/format'
import { businessById } from '../../data/catalog'
import { isOpenNow } from '../../lib/hours'
import { hasAddons, hasOptions, hasPackaging } from '../../lib/cart'
import { flyToCart } from '../../lib/flyToCart'

function FeaturedCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addItem, getQuantity } = useCart()
  const qty = getQuantity(product.id)
  const biz = businessById(product.businessId)
  const closed = !biz || !isOpenNow(biz)
  const isOut = product.stockStatus === 'agotado'
  const needsChoice = hasOptions(product) || hasAddons(product) || hasPackaging(product)
  const disabled = isOut || closed

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (needsChoice) { navigate(`/producto/${product.id}`); return }
    flyToCart(e.currentTarget)
    addItem(product)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="w-64 flex-shrink-0 snap-start flex items-center gap-3 bg-surface border border-amber-200 rounded-3xl p-3 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden">
        <ProductImage
          emoji={product.image}
          photo={product.photo}
          category={product.category}
          alt={product.name}
          size="md"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
          ✨ Destacado
        </span>
        <h3 className="text-sm font-bold text-text-primary mt-0.5 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-text-secondary mt-0.5 truncate">{product.businessName}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-bold text-text-primary">
            {formatAmount(product.price)}{' '}
            <span className="text-xs font-semibold text-text-secondary">CUP</span>
          </span>
          <button
            onClick={handleAdd}
            disabled={disabled}
            aria-label={needsChoice ? `Elegir opciones de ${product.name}` : `Añadir ${product.name}`}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
              disabled
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-gradient-primary text-white shadow-btn-primary hover:brightness-105'
            }`}
          >
            {needsChoice ? (
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

export function FeaturedSection({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.featured && p.stockStatus !== 'agotado')
  if (featured.length === 0) return null

  return (
    <section className="pt-5">
      <div className="flex items-end justify-between mb-3">
        <h2 className="flex items-center gap-2.5 text-[1.35rem] font-extrabold text-text-primary tracking-[-0.02em]">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" aria-hidden="true" />
          Destacados
        </h2>
      </div>
      {/* Carrusel horizontal con scroll suave */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-3 pb-1">
          {featured.map((p) => (
            <FeaturedCard key={p.id} product={p} />
          ))}
          {/* Espaciado final para que el último card no quede pegado al borde */}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </section>
  )
}
