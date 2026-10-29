import { useMemo } from 'react'
import { findBusinessByParam } from '../features/catalog'
import { useCatalogStore } from '../store/catalogStore'
import { useStatsStore } from '../store/statsStore'
import { FEATURED_BUSINESS_SLUG, SEASON_CATEGORY_SLUGS, pickSeasonProducts } from './seasonalFeatured'

/** Productos de la campaña (negocio destacado + dulces, solo disponibles, mezclados) del catálogo de la localidad activa. */
export function useSeasonProducts(limit: number) {
  const businesses = useCatalogStore((state) => state.businesses)
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const stats = useStatsStore((state) => state.stats)

  const featured = useMemo(() => findBusinessByParam(FEATURED_BUSINESS_SLUG, businesses), [businesses])
  const categoryIds = useMemo(
    () => new Set(categories.filter((category) => SEASON_CATEGORY_SLUGS.includes(category.slug)).map((category) => category.id)),
    [categories],
  )
  const seasonProducts = useMemo(
    () => pickSeasonProducts(products, { businessId: featured?.id ?? null, categoryIds }, stats, limit),
    [products, featured, categoryIds, stats, limit],
  )

  return { featured, businesses, seasonProducts }
}
