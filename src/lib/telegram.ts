import type { Order } from '../types'
import { syncCooldownWithServer } from './rateLimit'

export interface SendOrderResult {
  ok: boolean
  /** Número de sorteo asignado por el servidor (nuevo o el que el pedido ya traía). */
  raffleNumber?: number
  /** true si el servidor rechazó el envío por el límite de 1 pedido cada 3 minutos. */
  cooldown?: boolean
}

const REQUEST_TIMEOUT_MS = 20_000

/**
 * Envía el pedido a /api/order (función serverless). El navegador ya no habla
 * con Telegram ni conoce ningún token: el servidor valida el pedido contra el
 * catálogo, recalcula los precios y arma el vale. Aquí solo viajan ids,
 * cantidades, opciones y los datos de la dirección.
 */
export async function sendOrderToTelegram(order: Order): Promise<SendOrderResult> {
  const { address } = order
  const payload = {
    id: order.id,
    address: {
      nombre: address.nombre,
      apellidos: address.apellidos,
      telefono: address.telefono,
      direccion: address.direccion,
      referencia: address.referencia,
    },
    delivery: {
      scheduled: order.delivery !== undefined && order.delivery !== 'Lo antes posible',
      time: order.deliveryTime,
    },
    items: order.items.map((item) => ({
      product: { id: item.product.id },
      quantity: item.quantity,
      option: item.option,
      addon: item.addon ? { name: item.addon.name } : undefined,
      packaging: item.packaging ? { name: item.packaging.name } : undefined,
    })),
    raffleNumber: order.raffleNumber,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => null)

    if (res.status === 429) {
      const retryAfter = Number(data?.retryAfter)
      syncCooldownWithServer(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 180)
      return { ok: false, cooldown: true }
    }
    if (res.ok && data?.ok === true) {
      return { ok: true, raffleNumber: typeof data.raffleNumber === 'number' ? data.raffleNumber : undefined }
    }
    return { ok: false }
  } catch {
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}
