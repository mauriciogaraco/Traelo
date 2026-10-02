import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { attributeReferral } from '../api/referrals'
import { capturePendingReferralCode } from '../lib/referralAttribution'
import { useAuth } from '../hooks/useAuth'

/**
 * Landing de un link de invitación (/r/:codigo — checklist §9). El objetivo es conservar la
 * atribución, no bloquear nada: siempre se puede seguir navegando sin crear cuenta.
 *  - Invitado: el código queda guardado (ver lib/referralAttribution) hasta que se registre.
 *  - Ya autenticado (checklist §10): se atribuye de una vez (el backend valida autorreferencia y
 *    que no tenga ya un referente) — nunca se le muestra un error por esto, es información
 *    interna de negocio, no algo que el visitante deba resolver.
 */
export function ReferralLandingPage() {
  const { code = '' } = useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const attempted = useRef(false)

  useEffect(() => {
    if (isLoading || attempted.current || !code) return
    attempted.current = true
    if (isAuthenticated) {
      attributeReferral(code).catch(() => {
        /* silencioso a propósito: el visitante no puede hacer nada con un 403/409 acá */
      })
    } else {
      capturePendingReferralCode(code)
    }
  }, [code, isAuthenticated, isLoading])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-6xl" aria-hidden="true">
        🛍️
      </span>
      <div className="space-y-2">
        <h1 className="text-h1 text-text-primary">Te invitaron a Tráelo</h1>
        <p className="mx-auto max-w-sm text-body text-text-secondary">
          Compra en los negocios de tu comunidad y recibe tu pedido donde estés.
        </p>
      </div>
      {/* Columna con separación real: los enlaces son inline y `space-y` no los separaba. */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/registro"
          className="flex min-h-12 w-full items-center justify-center rounded-r-md bg-gradient-primary font-semibold text-white shadow-[0_4px_8px_0_rgb(var(--c-primary)/0.25)] hover:brightness-105"
        >
          Crear mi cuenta
        </Link>
        <Link
          to="/"
          className="flex min-h-12 w-full items-center justify-center rounded-r-md border border-primary font-semibold text-primary-text hover:bg-primary/5"
        >
          Explorar Tráelo
        </Link>
      </div>
    </div>
  )
}
