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
import { FEATURED_BUSINESS_SLUG, pickFeaturedProducts } from './seasonalFeatured'

/** Categorías de temporada, en orden de preferencia: sirven de destino del botón cuando no hay negocio destacado. */
const SEASON_CATEGORY_SLUGS = ['dulces', 'confituras']

/**
 * Halloween en el Home (entre el hero y el banner de Mandado): un saludo de marca y, debajo, los productos
 * disponibles del negocio destacado (Cronos). No anuncia descuentos ni sorteos. El botón lleva al negocio destacado
 * si está en la localidad; si no, a los dulces o a todos los negocios. Fuera de campaña no pinta nada.
 */
export function HalloweenBanner() {
  const businesses = useCatalogStore((state) => state.businesses)
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const stats = useStatsStore((state) => state.stats)
  const quickAdd = useQuickAdd()

  const featured = useMemo(() => findBusinessByParam(FEATURED_BUSINESS_SLUG, businesses), [businesses])
  const featuredProducts = useMemo(
    () => (featured ? pickFeaturedProducts(products, featured.id, stats) : []),
    [featured, products, stats],
  )

  if (!isHalloweenActive()) return null

  const featuredHref = featured ? businessPath(featured.id, businesses) : null
  const category = SEASON_CATEGORY_SLUGS.map((slug) => categories.find((c) => c.slug === slug)).find(Boolean)
  const to = featuredHref ?? (category ? categorySearchHref(category) : ALL_BUSINESSES_HREF)
  const cta = featured ? `Ver ${featured.name}` : category ? `Ver ${category.name.toLowerCase()}` : 'Ver negocios'

  return (
    <>
      <Link
        to={to}
        className="season-banner group relative block overflow-hidden rounded-2xl p-4 pr-24 text-white shadow-[0_12px_28px_-16px_rgb(124_45_18/0.9)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 sm:pr-40 lg:p-5 lg:pr-56"
      >
        {/* Murciélagos solo desde `sm`: en teléfonos estrechos el título envuelve y llegarían a tapar letras. */}
        <Bat className="season-float pointer-events-none absolute right-40 top-2.5 hidden h-4 w-8 text-white/70 sm:block" />
        <Bat className="season-float-slow pointer-events-none absolute right-24 top-6 hidden h-3 w-6 text-white/50 sm:block" />
        <Ghost className="pointer-events-none absolute -bottom-1 right-14 h-9 w-8 opacity-90 sm:right-28 sm:h-11 sm:w-10" />
        <Pumpkin className="pointer-events-none absolute -bottom-2 -right-1 h-[4.25rem] w-[4.6rem] drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] sm:h-24 sm:w-[6.5rem]" />

        <span className="relative block text-[17px] font-extrabold leading-5 lg:text-h2">Feliz Halloween en Tráelo</span>
        <span className="relative mt-0.5 block text-caption text-white/85">
          Que el único susto sea de película. Pide hoy y te lo llevamos a la puerta.
        </span>
        <span className="relative mt-2.5 inline-flex h-10 items-center gap-1 rounded-full bg-gradient-primary px-4 text-[14px] font-bold text-white shadow-btn-primary transition group-hover:brightness-105 group-hover:translate-x-0.5">
          {cta}
          <Icon name="chevron-right" size={16} />
        </span>
      </Link>

      {featured && featuredProducts.length > 0 && featuredHref && (
        <Section
          title={`Antójate con ${featured.name}`}
          action={
            <Link to={featuredHref} className="text-body-sm font-semibold text-primary-text hover:underline">
              Ver todo
            </Link>
          }
        >
          <Rail>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} layout="rail" onAdd={quickAdd} />
            ))}
          </Rail>
        </Section>
      )}
    </>
  )
}
