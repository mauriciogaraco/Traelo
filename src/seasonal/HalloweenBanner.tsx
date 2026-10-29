import { Link } from 'react-router-dom'
import { useCatalogStore } from '../store/catalogStore'
import { categorySearchHref } from '../components/catalog/CategoryCard'
import { ALL_BUSINESSES_HREF } from '../components/home/AllBusinessesLink'
import { Icon } from '../components/ui/Icon'
import { isHalloweenActive } from './halloween'
import { Bat, Ghost, Pumpkin } from './HalloweenArt'

/** Categorías de temporada, en orden de preferencia: la primera que exista en el catálogo activo manda el CTA. */
const SEASON_CATEGORY_SLUGS = ['dulces', 'confituras']

/**
 * Banner de Halloween del Home (entre el hero y el banner de Mandado). Es un saludo de marca: no anuncia
 * descuentos ni sorteos. El botón lleva a los dulces de la localidad si existen y, si no, a todos los negocios.
 * Fuera de campaña no pinta nada.
 */
export function HalloweenBanner() {
  const categories = useCatalogStore((state) => state.categories)
  if (!isHalloweenActive()) return null

  const category = SEASON_CATEGORY_SLUGS.map((slug) => categories.find((c) => c.slug === slug)).find(Boolean)
  const to = category ? categorySearchHref(category) : ALL_BUSINESSES_HREF
  const cta = category ? `Ver ${category.name.toLowerCase()}` : 'Ver negocios'

  return (
    <Link
      to={to}
      className="season-banner group relative block overflow-hidden rounded-2xl p-4 pr-24 text-white shadow-[0_12px_28px_-16px_rgb(59_26_99/0.9)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 sm:pr-40 lg:p-5 lg:pr-56"
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
      <span className="relative mt-2.5 inline-flex h-9 items-center gap-1 rounded-full bg-[#FFF9F3] px-4 text-[13px] font-bold text-[#C2410C] transition group-hover:translate-x-0.5">
        {cta}
        <Icon name="chevron-right" size={16} />
      </span>
    </Link>
  )
}
