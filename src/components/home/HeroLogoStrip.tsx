import { useMemo } from 'react'
import { useCatalogStore } from '../../store/catalogStore'
import { CatalogImage } from '../catalog/CatalogImage'

const LOGOS = 6

/**
 * Hero de una localidad que todavía no tiene fotos propias: en vez de quedar en blanco, los logos de
 * algunos de SUS negocios (los del catálogo activo, con logo primero). Decorativo.
 */
export function HeroLogoStrip() {
  const businesses = useCatalogStore((state) => state.businesses)
  const withLogo = useMemo(() => businesses.filter((business) => business.logoUrl).slice(0, LOGOS), [businesses])
  if (withLogo.length === 0) return null

  return (
    <div aria-hidden="true" className="flex items-center pl-3 pb-1">
      {withLogo.map((business) => (
        <CatalogImage
          key={business.id}
          uri={business.logoUrl}
          width={96}
          label={business.name}
          className="-ml-3 h-11 w-11 lg:h-14 lg:w-14 rounded-full ring-2 ring-white shadow-md"
        />
      ))}
    </div>
  )
}
