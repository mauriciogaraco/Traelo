import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { attributeReferral } from '../api/referrals'
import { Button } from '../components/ui/Button'
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
      <div className="w-full max-w-xs space-y-2">
        <Link
          to="/registro"
          className="flex min-h-12 w-full items-center justify-center rounded-r-md bg-gradient-primary font-semibold text-white"
        >
          Crear mi cuenta
        </Link>
        <Link to="/">
          <Button variant="outline" fullWidth>
            Explorar Tráelo
          </Button>
        </Link>
      </div>
    </div>
  )
}
