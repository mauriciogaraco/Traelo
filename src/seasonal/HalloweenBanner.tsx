import { Link } from 'react-router-dom'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { ProductCard } from '../components/catalog/ProductCard'
import { Rail, Section } from '../components/catalog/Section'
import { ALL_BUSINESSES_HREF } from '../components/home/AllBusinessesLink'
import { Icon } from '../components/ui/Icon'
import { HALLOWEEN_PATH, isHalloweenActive } from './halloween'
import { Bat, Ghost, Pumpkin } from './HalloweenArt'
import { useSeasonProducts } from './useSeasonProducts'

/** Cuántos productos de la campaña se asoman en el Home; la lista completa está en `HALLOWEEN_PATH`. */
const HOME_PREVIEW_LIMIT = 12

/**
 * Halloween en el Home (entre el hero y el banner de Mandado): un saludo de marca con UN botón a la lista completa
 * y, debajo, un adelanto con los productos DISPONIBLES del negocio destacado (Cronos) y de los dulces, mezclados.
 * No anuncia descuentos ni sorteos. Fuera de campaña no pinta nada.
 */
export function HalloweenBanner() {
  const { featured, seasonProducts } = useSeasonProducts(HOME_PREVIEW_LIMIT)
  const quickAdd = useQuickAdd()

  if (!isHalloweenActive()) return null

  // Sin nada que ofrecer en la localidad, el botón lleva a todos los negocios.
  const hasProducts = seasonProducts.length > 0
  const to = hasProducts ? HALLOWEEN_PATH : ALL_BUSINESSES_HREF
  const cta = !hasProducts ? 'Ver negocios' : featured ? `Ver ${featured.name} y dulces` : 'Ver dulces'

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
        <Link
          to={to}
          className="relative mt-2.5 inline-flex h-10 items-center gap-1 rounded-full bg-gradient-primary px-4 text-[14px] font-bold text-white shadow-btn-primary transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
        >
          {cta}
          <Icon name="chevron-right" size={16} />
        </Link>
      </div>

      {hasProducts && (
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
