import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

/**
 * Banner destacado del módulo Mandado (encargo personalizado) — mismo lenguaje visual que
 * AllBusinessesLink (degradado de marca + círculos decorativos + CTA), pero su propia sección en
 * vez de un tile de categoría: se usa en el Home (justo bajo el buscador) y en Ayuda, los dos
 * puntos donde el cliente podría buscar "¿y si lo que necesito no está en ningún catálogo?".
 */
export function MandadoBanner({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/mandado"
      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-hero p-4 text-white shadow-[0_10px_24px_-14px_rgb(var(--c-primary)/0.8)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${className}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 right-14 h-16 w-16 rounded-full bg-white/10" />

      <span aria-hidden="true" className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[28px]">
        🛵
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="block text-[17px] font-bold leading-5">¿Necesitas un mandado?</span>
        <span className="block text-caption text-white/85 mt-0.5">
          Comprar, recoger o llevar algo a donde haga falta — te lo resolvemos
        </span>
      </span>

      <span className="relative flex h-10 shrink-0 items-center gap-1 rounded-full bg-white px-4 text-[13px] font-bold text-[#C2410C] transition group-hover:translate-x-0.5">
        Pedir
        <Icon name="chevron-right" size={16} />
      </span>
    </Link>
  )
}
