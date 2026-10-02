import { Link } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'

/**
 * Invitación a crear cuenta para ganar puntos, debajo de "Top Negocios". Solo se ve sin sesión
 * (invitado): con cuenta o mientras se lee la sesión guardada no se muestra, para no parpadear.
 */
export function RegisterPointsBanner() {
  const status = useSessionStore((state) => state.status)
  if (status !== 'GUEST') return null

  return (
    <Link
      to="/registro"
      className="group flex items-center gap-3 rounded-r-lg border border-gold/40 bg-gold-soft p-3 pr-3.5 shadow-soft transition hover:-translate-y-0.5 hover:border-gold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 lg:max-w-md"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gold text-[22px] shadow-sm"
      >
        ⭐
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-5 text-text-primary">Regístrate y recibe puntos</span>
        <span className="block text-caption text-text-secondary">Puntos por cada pedido realizado</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-[13px] font-bold text-primary-on shadow-btn-primary transition group-hover:bg-primary-hover">
        Registro
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  )
}
