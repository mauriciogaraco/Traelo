import { memo } from 'react'
import { Link } from 'react-router-dom'
import { businessPath, ratingLabel } from '../../features/catalog'
import { useCatalogStore } from '../../store/catalogStore'
import type { CatalogBusiness, CatalogBusinessStats } from '../../types/backend/catalog'
import { Icon } from '../ui/Icon'
import { BusinessStatusBadge } from './BusinessStatusBadge'
import { CatalogImage } from './CatalogImage'

interface BusinessCardProps {
  business: CatalogBusiness
  /** Si se pasa (aunque sea null), muestra la calificación o "Sin reseñas todavía". */
  stats?: CatalogBusinessStats | null
  /** Insignia destacada, p.ej. "🔥 Popular" o "⭐ Top valorado". */
  badge?: string
  /** `rail`: ancho fijo para carruseles horizontales. */
  layout?: 'rail' | 'list'
}

/**
 * Tarjeta de negocio — `BusinessCard` de mobile: fila compacta (logo, nombre, dirección, reseñas
 * y estado) en teléfono, igual que la app. Desde `sm` la web tiene espacio de sobra: la foto pasa
 * a ocupar el ancho completo arriba, como una tarjeta de catálogo — mismo contenido, mejor
 * aprovechado en grilla.
 */
export const BusinessCard = memo(function BusinessCard({ business, stats, badge, layout = 'list' }: BusinessCardProps) {
  const rating = ratingLabel(stats)
  const businesses = useCatalogStore((state) => state.businesses)
  return (
    <Link
      to={businessPath(business.id, businesses)}
      className={`group flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-0 rounded-r-lg sm:rounded-lg bg-surface p-3 sm:p-0 shadow-card border border-border/60 overflow-hidden transition hover:shadow-card-hover hover:border-primary/30 sm:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        // El carrusel (Rail) sigue siendo una fila con scroll horizontal hasta `lg` (recién ahí
        // pasa a grilla): un ancho fijo hasta ese punto, para que las tarjetas no queden cada una
        // con un ancho distinto según el largo del nombre.
        layout === 'rail' ? 'w-[280px] shrink-0 lg:w-auto' : 'w-full'
      }`}
    >
      <div className="relative shrink-0 sm:shrink sm:w-full">
        <CatalogImage
          uri={business.logoUrl}
          width={280}
          label={business.name}
          alt=""
          className="w-16 h-16 rounded-r-md sm:w-full sm:h-auto sm:aspect-[16/10] sm:rounded-none"
        />
        {badge && (
          <span className="hidden sm:inline-flex absolute top-2 left-2 rounded-full bg-gold-soft px-2.5 py-1 text-label text-gold-text shadow-soft">
            {badge}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-start gap-1 sm:gap-1.5 sm:p-3.5">
        {badge && <span className="sm:hidden rounded-full bg-gold-soft px-2 py-0.5 text-label text-gold-text">{badge}</span>}
        <h3 className="w-full text-[15px] sm:text-base leading-5 font-semibold text-text-primary truncate">
          {business.name}
        </h3>
        {stats !== undefined &&
          (rating ? (
            <p className="flex items-center gap-1 text-caption font-bold text-text-primary">
              <Icon name="star" size={13} filled className="text-gold" />
              {rating}
            </p>
          ) : (
            <p className="text-caption text-text-tertiary">Sin reseñas todavía</p>
          ))}
        <BusinessStatusBadge business={business} />
      </div>
      <Icon name="chevron-right" size={18} className="shrink-0 text-text-tertiary sm:hidden" />
    </Link>
  )
})
