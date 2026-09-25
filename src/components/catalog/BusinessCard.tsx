import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ratingLabel } from '../../features/catalog'
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

/** Tarjeta de negocio — `BusinessCard` de mobile: logo, nombre, dirección, reseñas y estado. */
export const BusinessCard = memo(function BusinessCard({ business, stats, badge, layout = 'list' }: BusinessCardProps) {
  const rating = ratingLabel(stats)
  return (
    <Link
      to={`/negocio/${business.id}`}
      className={`flex items-center gap-3 rounded-r-lg bg-surface p-3 shadow-card border border-border/60 transition hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        layout === 'rail' ? 'w-[280px] shrink-0 lg:w-auto' : 'w-full'
      }`}
    >
      <CatalogImage uri={business.logoUrl} width={64} label={business.name} alt="" className="w-16 h-16 shrink-0 rounded-r-md" />
      <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
        {badge && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-label text-gold-text">{badge}</span>}
        <h3 className="w-full text-[15px] leading-5 font-semibold text-text-primary truncate">{business.name}</h3>
        <p className="w-full flex items-center gap-0.5 text-caption text-text-secondary">
          <Icon name="location" size={13} className="shrink-0 text-text-tertiary" />
          <span className="truncate">{business.address}</span>
        </p>
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
      <Icon name="chevron-right" size={18} className="shrink-0 text-text-tertiary" />
    </Link>
  )
})
