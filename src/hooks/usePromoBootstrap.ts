import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { track } from '../analytics'
import { isFirstPromoLanding, parsePromoParam } from '../features/promo/promo'
import { usePromoStore } from '../store/promoStore'

/**
 * Guarda el código de promoción que trae el enlace (`?promo=`, con su `?ciudad=`) para usarlo en el
 * checkout, aunque la persona navegue antes de pedir. Un enlace sin código no borra el que ya hay.
 * También registra la llegada al Home con el código (`promo_landing`), una vez por visita.
 */
export function usePromoBootstrap(): void {
  const [params] = useSearchParams()
  useEffect(() => {
    const code = parsePromoParam(params)
    if (!code) return
    const cityCode = params.get('ciudad')?.trim().toLowerCase() || null
    usePromoStore.getState().setPromo(code, cityCode)
    // Nunca se manda el código en el evento: solo que llegó, y a qué localidad.
    if (isFirstPromoLanding(code, sessionStorage)) track('promo_landing', cityCode ? { properties: { cityCode } } : undefined)
  }, [params])
}
