import { useEffect, useState } from 'react'
import { getMyReferralSummary } from '../api/referrals'
import type { AmbassadorTier } from '../types/backend/referral'

/**
 * Insignia de embajador de la cuenta (null = no es embajador). Sale del resumen de referidos. Sin sesión no pide
 * nada, y si falla simplemente no hay insignia: nunca debe estorbar al perfil.
 */
export function useAmbassadorTier(enabled: boolean): AmbassadorTier | null {
  const [tier, setTier] = useState<AmbassadorTier | null>(null)

  useEffect(() => {
    if (!enabled) {
      setTier(null)
      return
    }
    let cancelled = false
    getMyReferralSummary()
      .then((summary) => {
        if (!cancelled) setTier(summary.ambassadorTier ?? null)
      })
      .catch(() => {
        if (!cancelled) setTier(null)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return tier
}
