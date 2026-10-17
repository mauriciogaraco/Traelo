import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parsePromoParam } from '../features/promo/promo'
import { usePromoStore } from '../store/promoStore'

/**
 * Guarda el código de promoción que trae el enlace (`?promo=`, con su `?ciudad=`) para usarlo en el
 * checkout, aunque la persona navegue antes de pedir. Un enlace sin código no borra el que ya hay.
 */
export function usePromoBootstrap(): void {
  const [params] = useSearchParams()
  useEffect(() => {
    const code = parsePromoParam(params)
    if (code) usePromoStore.getState().setPromo(code, params.get('ciudad')?.trim().toLowerCase() || null)
  }, [params])
}
