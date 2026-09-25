import { memo } from 'react'
import { Link } from 'react-router-dom'
import { visualForProduct } from '../../features/catalog'
import { useCatalogStore } from '../../store/catalogStore'
import type { CatalogProduct } from '../../types/backend/catalog'
import { StatusBadge } from '../ui/StatusBadge'
import { CatalogImage } from './CatalogImage'
import { Price } from './Price'

interface ProductCardProps {
  product: CatalogProduct
  /** Si se pasa, muestra el "+" para agregar 1 al carrito sin abrir el detalle. */
  onAdd?: (product: CatalogProduct, origin: HTMLElement) => void
  /** Línea secundaria bajo el nombre (p.ej. el negocio, en resultados de búsqueda). */
  subtitle?: string
  /** Insignia sobre la foto, p.ej. "🔥 Popular". */
  badge?: string
  /** `rail`: ancho fijo para carruseles horizontales; `grid`: ocupa su celda. */
  layout?: 'rail' | 'grid'
}

/**
 * Tarjeta de producto — `ProductCard` de mobile: foto (o el recuadro de su categoría), nombre,
 * "pocas unidades", precio con oferta y "+" rápido. Toda la tarjeta lleva a la ficha.
 */
export const ProductCard = memo(function ProductCard({ product, onAdd, subtitle, badge, layout = 'grid' }: ProductCardProps) {
  const categories = useCatalogStore((state) => state.categories)

  return (
    <article
      className={`relative flex flex-col rounded-r-lg bg-surface p-2 shadow-card border border-border/60 transition hover:shadow-card-hover ${
        layout === 'rail' ? 'w-[152px] sm:w-[172px] shrink-0 lg:w-auto' : 'w-full'
      }`}
    >
      <Link to={`/producto/${product.id}`} className="flex flex-col flex-1 rounded-r-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        {badge && (
          <span className="absolute top-3.5 left-3.5 z-[2] rounded-full bg-gold-soft px-2 py-0.5 text-label text-gold-text">
            {badge}
          </span>
        )}
        <CatalogImageBox product={product} categories={categories} />
        <div className="flex flex-col gap-1 pt-2">
          <h3 className="text-[15px] leading-[18px] font-semibold text-text-primary line-clamp-2 min-h-9">{product.name}</h3>
          {subtitle && <p className="text-caption text-text-secondary truncate">{subtitle}</p>}
          {product.lowStock && (
            <span>
              <StatusBadge label="POCAS UNIDADES" tone="warning" />
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between gap-1 pt-1 mt-auto">
        <div className="flex-1 min-w-0">
          <Price price={product.price} effectivePrice={product.effectivePrice} compact />
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={(e) => onAdd(product, e.currentTarget)}
            aria-label={`Agregar ${product.name} al carrito`}
            className="w-8 h-8 shrink-0 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-btn-primary hover:brightness-105 active:scale-95 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>
    </article>
  )
})

function CatalogImageBox({ product, categories }: { product: CatalogProduct; categories: ReturnType<typeof useCatalogStore.getState>['categories'] }) {
  return (
    <CatalogImage
      uri={product.imageUrl}
      width={180}
      visual={visualForProduct(product, categories)}
      alt={product.name}
      className="w-full aspect-[4/3] rounded-r-md"
    />
  )
}
