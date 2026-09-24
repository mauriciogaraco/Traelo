import type { Order } from '../types'

export interface SendOrderResult {
  ok: boolean
  /** Número de sorteo asignado por el servidor (nuevo o el que el pedido ya traía). */
  raffleNumber?: number
  /** Causa del fallo para mostrarla/diagnosticar: mensaje del servidor + código, o el problema de red. */
  reason?: string
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

    if (res.ok && data?.ok === true) {
      return { ok: true, raffleNumber: typeof data.raffleNumber === 'number' ? data.raffleNumber : undefined }
    }
    const code = typeof data?.error === 'string' ? data.error : `http_${res.status}`
    const message = typeof data?.message === 'string' ? `${data.message} ` : ''
    return { ok: false, reason: `${message}[${code}]` }
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError'
    return { ok: false, reason: aborted ? '[timeout] El servidor tardó demasiado.' : '[red] No hay conexión con el servidor.' }
  } finally {
    clearTimeout(timer)
  }
}
