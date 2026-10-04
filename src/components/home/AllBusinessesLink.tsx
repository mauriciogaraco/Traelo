import { Link } from 'react-router-dom'
import type { CatalogBusiness } from '../../types/backend/catalog'
import { CatalogImage } from '../catalog/CatalogImage'
import { Icon } from '../ui/Icon'

/** Ruta de la lista completa de negocios (Buscar, pestaña Negocios, de la A a la Z). */
export const ALL_BUSINESSES_HREF = '/buscar?tab=negocios'

const AVATARS = 3

/**
 * Banner del Home para abrir la lista de todos los negocios, donde cada quien encuentra el suyo.
 * Muestra los logos de algunos negocios (con foto primero) para que se vea que hay de dónde elegir.
 */
export function AllBusinessesLink({ businesses }: { businesses: CatalogBusiness[] }) {
  const preview = [...businesses].sort((a, b) => Number(Boolean(b.logoUrl)) - Number(Boolean(a.logoUrl))).slice(0, AVATARS)

  return (
    <Link
      to={ALL_BUSINESSES_HREF}
      className="group relative flex items-center gap-2.5 overflow-hidden rounded-r-lg bg-gradient-hero p-3.5 text-white shadow-[0_10px_24px_-14px_rgb(var(--c-primary)/0.8)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-16 h-20 w-20 rounded-full bg-white/10" />

      {preview.length > 0 && (
        <span aria-hidden="true" className="relative flex shrink-0 items-center pl-3">
          {preview.map((business) => (
            <CatalogImage
              key={business.id}
              uri={business.logoUrl}
              width={80}
              label={business.name}
              className="-ml-3 h-9 w-9 rounded-full ring-2 ring-white shadow-sm"
            />
          ))}
        </span>
      )}

      <span className="relative min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-5">Ver todos los negocios</span>
        <span className="block text-caption text-white/85">
          {businesses.length > 0 ? `${businesses.length} negocios · encuentra el tuyo` : 'Encuentra el tuyo'}
        </span>
      </span>

      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#C2410C] transition group-hover:translate-x-0.5">
        <Icon name="chevron-right" size={18} />
      </span>
    </Link>
  )
}
