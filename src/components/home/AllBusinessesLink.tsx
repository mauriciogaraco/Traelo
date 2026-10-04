import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

/** Ruta de la lista completa de negocios (Buscar, pestaña Negocios, de la A a la Z). */
export const ALL_BUSINESSES_HREF = '/buscar?tab=negocios'

/** Botón del Home para abrir la lista de todos los negocios, donde cada quien encuentra el suyo. */
export function AllBusinessesLink({ count }: { count: number }) {
  return (
    <Link
      to={ALL_BUSINESSES_HREF}
      className="group flex items-center gap-3 rounded-r-lg border border-primary/30 bg-primary-soft px-4 py-3 text-primary-text transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-on">
        <Icon name="grid" size={18} />
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-bold leading-5">
        Ver todos los negocios
        {count > 0 && <span className="font-semibold opacity-80"> · {count}</span>}
      </span>
      <Icon name="chevron-right" size={18} className="transition group-hover:translate-x-0.5" />
    </Link>
  )
}
