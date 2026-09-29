import { getRewards } from '../api/rewards'
import { cartKey, isRedemptionError, redemptionErrorMessage } from '../features/rewards'
import { useRewardsStore } from '../store/rewardsStore'
import { useSessionStore } from '../store/sessionStore'
import type { CartItem } from '../store/cartStore'
import type { OrderQuote, Reward } from '../types/backend/rewards'
import { refreshPoints } from './pointsService'
import { requestCheckoutQuote, type CheckoutQuoteResult } from './checkoutService'

let inFlightCustomerId: string | null = null
let inFlightToken = 0
let inFlight: Promise<boolean> | null = null

/**
 * Baja las recompensas (y, con sesión, el saldo y qué alcanza/cuánto falta: lo decide el servidor).
 * Un solo vuelo a la vez POR CLIENTE — si la sesión cambia (p. ej. termina de hidratarse justo
 * después de arrancar como invitado) esto es una llamada nueva, no la de antes: reutilizar la
 * promesa vieja descartaría su respuesta al ver que "el cliente cambió" y las recompensas se
 * quedarían sin cargar hasta el próximo disparador. NUNCA lanza: las recompensas son un extra; sin
 * red se conserva lo último visto.
 */
export function refreshRewards(): Promise<boolean> {
  const customerId = useSessionStore.getState().customer?.id ?? null
  if (inFlight && inFlightCustomerId === customerId) return inFlight

  const token = ++inFlightToken
  inFlightCustomerId = customerId
  inFlight = (async () => {
    try {
      const snapshot = await getRewards()
      // La sesión cambió mientras esperaba (otra cuenta / cerró sesión): esta respuesta ya no aplica.
      if ((useSessionStore.getState().customer?.id ?? null) !== customerId) return false
      useRewardsStore.getState().setSnapshot(snapshot)
      return true
    } catch {
      return false
    } finally {
      if (inFlightToken === token) inFlight = null
    }
  })()
  return inFlight
}

export type RedemptionQuoteResult = CheckoutQuoteResult

/**
 * Pide al servidor la cotización del canje (productos, mensajería, Servicio Tráelo y total con
 * los puntos aplicados). NO descuenta nada. Si el saldo cambió o la recompensa dejó de valer, se
 * refresca la información y se explica con un mensaje amable — nunca falla en silencio.
 */
export async function requestRedemptionQuote(items: CartItem[], reward: Reward): Promise<RedemptionQuoteResult> {
  const expectedBalance = useRewardsStore.getState().balance ?? undefined
  const result = await requestCheckoutQuote(items, { rewardId: reward.id, expectedBalance })
  if (!result.ok && isRedemptionError(result.code)) {
    void refreshRewards()
    void refreshPoints()
    return { ok: false, code: result.code, message: redemptionErrorMessage(result.code, result.message) }
  }
  return result
}

/** El cliente confirmó el canje en el carrito: queda listo para viajar con el pedido (aún no se descuenta nada). */
export function confirmRedemption(items: CartItem[], reward: Reward, quote: OrderQuote): void {
  const expectedBalance = quote.redemption?.balanceBefore ?? useRewardsStore.getState().balance ?? 0
  useRewardsStore.getState().setApplied({ reward, expectedBalance, quote, cartKey: cartKey(items) })
}

export function clearRedemption(): void {
  useRewardsStore.getState().setApplied(null)
}

export function resetRewardsState(): void {
  useRewardsStore.getState().clear()
}
