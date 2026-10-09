import { withoutCartEvents } from '../analytics'
import { createCheckoutOrder } from '../api/checkout'
import { ApiError } from '../api/ApiError'
import { quoteCheckout } from '../api/rewards'
import { buildBusinessesInput, buildCheckoutInput, type BuildCheckoutInputParams } from '../features/checkout/buildCheckoutInput'
import { isRedemptionError, redemptionErrorMessage } from '../features/rewards'
import { useCartStore, type CartItem } from '../store/cartStore'
import { useGuestOrdersStore, useGuestProfileStore, useOrderStore } from '../store/guestStore'
import type { CartChangeDetail, CartChangedErrorDetails, Order } from '../types/backend/order'
import type { OrderQuote, RedemptionRequest } from '../types/backend/rewards'
import { notifyOrderToTelegram } from './orderNotifyService'
import { refreshPoints } from './pointsService'
import { clearRedemption, refreshRewards } from './rewardsService'

/*
 * Checkout contra el backend — `checkoutService`, `rewardsService` y `cartCheckService` de la app
 * móvil. El servidor es la autoridad del dinero: aquí solo se arma el pedido (sin precios) y se
 * traducen los errores.
 */

// ── Cotización ────────────────────────────────────────────────────────────────

export type CheckoutQuoteResult =
  | { ok: true; quote: OrderQuote }
  | { ok: false; code: string; message: string; details?: unknown }

/**
 * Cotización de solo lectura del carrito (productos, empaque, mensajería, servicio, canje y
 * total) — la usa cualquier checkout, con o sin canje, para mostrar el total autoritativo antes
 * de confirmar. No crea ni descuenta nada.
 */
export async function requestCheckoutQuote(items: CartItem[], redemption?: RedemptionRequest): Promise<CheckoutQuoteResult> {
  try {
    return { ok: true, quote: await quoteCheckout({ businesses: buildBusinessesInput(items), redemption }) }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code, message: error.message, details: error.details }
    return { ok: false, code: 'UNKNOWN_ERROR', message: 'No pudimos calcular el total. Revisa tu conexión.' }
  }
}

// ── Revisión del carrito antes del formulario ─────────────────────────────────

export type CartPrecheck =
  | { ok: true }
  | { ok: false; issues: CartChangeDetail[]; /** Motivo general (p. ej. pasó el corte del día). */ message?: string }

/** Motivos que se arreglan quitando el producto o el local del carrito (un cambio de precio, no). */
const REMOVABLE_REASONS = new Set<CartChangeDetail['reason']>([
  'BUSINESS_NOT_FOUND',
  'BUSINESS_INACTIVE',
  'BUSINESS_NOT_ACCEPTING_ORDERS',
  'BUSINESS_CLOSED',
  'PRODUCT_NOT_FOUND',
  'PRODUCT_UNAVAILABLE',
  'PACKAGING_UNAVAILABLE',
])

export const isRemovableIssue = (issue: CartChangeDetail) => REMOVABLE_REASONS.has(issue.reason)

/**
 * Valida el carrito con el servidor ANTES del formulario de entrega (misma cotización, mismas reglas
 * que crear el pedido): un agotado o un local cerrado se ven en el carrito, donde se arreglan. Nunca
 * bloquea por otra causa: sin red o con error del servidor se sigue (el backend valida al confirmar).
 */
export async function precheckCart(items: CartItem[], redemption?: RedemptionRequest): Promise<CartPrecheck> {
  const result = await requestCheckoutQuote(items, redemption)
  if (result.ok) {
    useCartStore.getState().setCheckoutIssues([])
    return { ok: true }
  }
  if (result.code === 'CART_CHANGED') {
    const changes = (result.details as CartChangedErrorDetails | undefined)?.changes ?? []
    useCartStore.getState().setCheckoutIssues(changes)
    return { ok: false, issues: changes }
  }
  if (result.code === 'ORDERS_CLOSED_FOR_TODAY') return { ok: false, issues: [], message: result.message }
  return { ok: true }
}

/** Quita del carrito, de una vez, todo lo que el servidor dijo que ya no se puede pedir. */
export function removeUnavailableFromCart(issues: CartChangeDetail[]): number {
  const cart = useCartStore.getState()
  const before = cart.items.length
  for (const issue of issues.filter(isRemovableIssue)) {
    if (issue.type === 'business' && issue.businessId) cart.removeBusinessItems(issue.businessId)
    else if (issue.type === 'product' && issue.productId) cart.removeProduct(issue.productId)
  }
  // Lo que queda (p. ej. un cambio de precio) sigue marcado para que la persona lo vea.
  useCartStore.getState().setCheckoutIssues(issues.filter((issue) => !isRemovableIssue(issue)))
  return before - useCartStore.getState().items.length
}

// ── Crear el pedido ───────────────────────────────────────────────────────────

export type CheckoutResult =
  | { ok: true; order: Order; isGuest: boolean }
  | { ok: false; code: string; message: string }

/**
 * Crea el pedido (POST /checkout). NO exige cuenta: sin sesión es de invitado y el backend entrega
 * UNA vez el token para seguirlo, que se guarda en este navegador. Después avisa al grupo de Telegram
 * (en segundo plano: si el aviso falla, el pedido ya está en el sistema igual).
 */
export async function submitCheckout(params: BuildCheckoutInputParams): Promise<CheckoutResult> {
  try {
    const { guestAccessToken, ...order } = await createCheckoutOrder(buildCheckoutInput(params))
    const isGuest = guestAccessToken !== undefined
    if (guestAccessToken) {
      useGuestOrdersStore.getState().add({
        orderId: order.id,
        orderNumber: order.orderNumber,
        token: guestAccessToken,
        createdAt: order.createdAt,
      })
      useGuestProfileStore.getState().setProfile({
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        addressReference: order.addressReference ?? '',
        location: params.location ?? null,
      })
      void notifyOrderToTelegram(order.id, guestAccessToken)
    }
    // Vaciar el carrito porque el pedido se envió no es "quitar productos": no se cuenta como abandono.
    withoutCartEvents(() => useCartStore.getState().clearCart())
    useOrderStore.getState().setLastCreatedOrder(order)
    if (params.redemption) {
      // Los puntos ya se descontaron en el servidor junto con el pedido: se actualiza el saldo y las recompensas.
      clearRedemption()
      void refreshPoints()
      void refreshRewards()
    }
    return { ok: true, order, isGuest }
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'CART_CHANGED') {
        const details = err.details as CartChangedErrorDetails | undefined
        useCartStore.getState().setCheckoutIssues(details?.changes ?? [])
      }
      if (isRedemptionError(err.code)) {
        // El canje ya no vale (saldo distinto, recompensa inactiva…): se quita, se actualiza y se explica.
        clearRedemption()
        void refreshPoints()
        void refreshRewards()
        return { ok: false, code: err.code, message: redemptionErrorMessage(err.code, err.message) }
      }
      return { ok: false, code: err.code, message: err.message }
    }
    return { ok: false, code: 'UNKNOWN_ERROR', message: 'Ocurrió un error inesperado.' }
  }
}
