import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogStore } from '../store/catalogStore'
import { useStatsStore } from '../store/statsStore'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { businessPath, findBusinessByParam } from '../features/catalog'
import { ProductCard } from '../components/catalog/ProductCard'
import { categorySearchHref } from '../components/catalog/CategoryCard'
import { Rail, Section } from '../components/catalog/Section'
import { ALL_BUSINESSES_HREF } from '../components/home/AllBusinessesLink'
import { Icon } from '../components/ui/Icon'
import { isHalloweenActive } from './halloween'
import { Bat, Ghost, Pumpkin } from './HalloweenArt'
import { FEATURED_BUSINESS_SLUG, SEASON_CATEGORY_SLUGS, pickSeasonProducts } from './seasonalFeatured'

const PRIMARY_CTA =
  'inline-flex h-10 items-center gap-1 rounded-full bg-gradient-primary px-4 text-[14px] font-bold text-white shadow-btn-primary transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40'
const SECONDARY_CTA =
  'inline-flex h-10 items-center gap-1 rounded-full border border-white/40 px-4 text-[14px] font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40'

/**
 * Halloween en el Home (entre el hero y el banner de Mandado): un saludo de marca y, debajo, un carrusel con los
 * productos DISPONIBLES del negocio destacado (Cronos) y de los dulces, mezclados. No anuncia descuentos ni sorteos.
 * Los botones llevan al negocio destacado (si está en la localidad) y a los dulces. Fuera de campaña no pinta nada.
 */
export function HalloweenBanner() {
  const businesses = useCatalogStore((state) => state.businesses)
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const stats = useStatsStore((state) => state.stats)
  const quickAdd = useQuickAdd()

  const featured = useMemo(() => findBusinessByParam(FEATURED_BUSINESS_SLUG, businesses), [businesses])
  const seasonCategories = useMemo(
    () => SEASON_CATEGORY_SLUGS.map((slug) => categories.find((c) => c.slug === slug)).filter((c) => c !== undefined),
    [categories],
  )
  const seasonProducts = useMemo(
    () =>
      pickSeasonProducts(
        products,
        { businessId: featured?.id ?? null, categoryIds: new Set(seasonCategories.map((c) => c.id)) },
        stats,
      ),
    [products, featured, seasonCategories, stats],
  )

  if (!isHalloweenActive()) return null

  const featuredHref = featured ? businessPath(featured.id, businesses) : null
  const sweetsCategory = seasonCategories[0]
  const sweetsHref = sweetsCategory ? categorySearchHref(sweetsCategory) : null
  // Sin Cronos ni dulces en la localidad, un único botón lleva a todos los negocios.
  const fallbackHref = featuredHref || sweetsHref ? null : ALL_BUSINESSES_HREF

  return (
    <>
      <div className="season-banner relative overflow-hidden rounded-2xl p-4 pr-24 text-white shadow-[0_12px_28px_-16px_rgb(124_45_18/0.9)] sm:pr-40 lg:p-5 lg:pr-56">
        {/* Murciélagos solo desde `sm`: en teléfonos estrechos el título envuelve y llegarían a tapar letras. */}
        <Bat className="season-float pointer-events-none absolute right-40 top-2.5 hidden h-4 w-8 text-white/70 sm:block" />
        <Bat className="season-float-slow pointer-events-none absolute right-24 top-6 hidden h-3 w-6 text-white/50 sm:block" />
        <Ghost className="pointer-events-none absolute -bottom-1 right-14 h-9 w-8 opacity-90 sm:right-28 sm:h-11 sm:w-10" />
        <Pumpkin className="pointer-events-none absolute -bottom-2 -right-1 h-[4.25rem] w-[4.6rem] drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] sm:h-24 sm:w-[6.5rem]" />

        <h2 className="relative text-[17px] font-extrabold leading-5 lg:text-h2">Feliz Halloween en Tráelo</h2>
        <p className="relative mt-0.5 text-caption text-white/85">
          Que el único susto sea de película. Pide hoy y te lo llevamos a la puerta.
        </p>
        <div className="relative mt-2.5 flex flex-wrap gap-2">
          {featured && featuredHref && (
            <Link to={featuredHref} className={PRIMARY_CTA}>
              Ver {featured.name}
              <Icon name="chevron-right" size={16} />
            </Link>
          )}
          {sweetsHref && (
            <Link to={sweetsHref} className={featuredHref ? SECONDARY_CTA : PRIMARY_CTA}>
              Ver dulces
              <Icon name="chevron-right" size={16} />
            </Link>
          )}
          {fallbackHref && (
            <Link to={fallbackHref} className={PRIMARY_CTA}>
              Ver negocios
              <Icon name="chevron-right" size={16} />
            </Link>
          )}
        </div>
      </div>

      {seasonProducts.length > 0 && (
        <Section title={featured ? `${featured.name} y dulces` : 'Dulces para esta noche'}>
          <Rail>
            {seasonProducts.map((product) => (
              <ProductCard key={product.id} product={product} layout="rail" onAdd={quickAdd} />
            ))}
          </Rail>
        </Section>
      )}
    </>
  )
}
