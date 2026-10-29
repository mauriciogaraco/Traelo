import { isHalloweenActive } from './halloween'
import { Bat, Cobweb } from './HalloweenArt'

/** Adorno del hero del Home: telaraña en la esquina y dos murciélagos. Decorativo; el título y el buscador no se tocan. */
export function HalloweenHeroDecor() {
  if (!isHalloweenActive()) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <Cobweb className="absolute right-0 top-0 h-20 w-20 -scale-x-100 text-white/30 lg:h-32 lg:w-32" />
      {/* En teléfono el título ocupa casi todo el ancho: los murciélagos solo desde `lg`. */}
      <Bat className="season-float absolute right-24 top-8 hidden h-6 w-12 text-white/80 lg:block" />
      <Bat className="season-float-slow absolute right-12 top-16 hidden h-4 w-8 text-white/60 lg:block" />
    </div>
  )
}
