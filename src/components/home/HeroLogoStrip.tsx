import { useMemo } from 'react'
import { useCatalogStore } from '../../store/catalogStore'
import { CatalogImage } from '../catalog/CatalogImage'

const LOGOS = 10

/**
 * Hero de una localidad que todavía no tiene fotos propias: en vez de quedar en blanco, los logos de
 * hasta 10 de SUS negocios (los del catálogo activo con logo) y "…" si hay más. Decorativo.
 */
export function HeroLogoStrip() {
  const businesses = useCatalogStore((state) => state.businesses)
  const allWithLogo = useMemo(() => businesses.filter((business) => business.logoUrl), [businesses])
  const withLogo = allWithLogo.slice(0, LOGOS)
  if (withLogo.length === 0) return null
  // Hay más negocios con logo de los que caben: puntos suspensivos al final.
  const hasMore = allWithLogo.length > LOGOS

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
      {hasMore && (
        <span className="-ml-3 flex h-11 w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-white text-h3 font-bold leading-none text-[#9A3412] ring-2 ring-white shadow-md">
          …
        </span>
      )}
    </div>
  )
}
