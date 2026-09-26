// Aviso a Telegram de un pedido que la web YA creó en el backend (POST /checkout). A diferencia de
// /api/order (flujo anterior, que armaba el vale con lo que mandaba el navegador), aquí el navegador
// solo manda el id del pedido y su token de invitado: esta función lee el pedido REAL del backend y
// arma el vale con esos datos. Así nadie puede colar un vale falso ni cambiar precios.
import { chunkLines, deliverOrder, esc, formatPrice } from './core.js'

const DEFAULT_API_URL = 'https://backend-fi7x.onrender.com'
const BACKEND_TIMEOUT_MS = 20000
/** Solo se avisa de pedidos recientes: evita reenviar vales viejos con un token guardado. */
const MAX_ORDER_AGE_MS = 15 * 60 * 1000
const ASAP_LABEL = 'Lo antes posible'

/** Backend y API key: las mismas variables que usa la web (VITE_*) o unas propias del servidor. */
export function backendConfig(env = process.env) {
  const url = (env.TRAELO_API_URL || env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, '')
  const apiKey = (env.TRAELO_API_KEY || env.VITE_API_KEY || '').trim()
  return { baseUrl: `${url}/api/v1`, apiKey }
}

export async function fetchGuestOrder({ baseUrl, apiKey }, orderId, guestToken) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS)
  try {
    const res = await globalThis.fetch(`${baseUrl}/guest/orders/${encodeURIComponent(orderId)}`, {
      headers: { accept: 'application/json', 'X-Api-Key': apiKey, 'X-Guest-Token': guestToken },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    return body?.data ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const cup = (value) => formatPrice(Math.round(Number(value) || 0))

/** Vale del pedido con los datos que devolvió el backend (OrderDTO). */
export function buildBackendOrderLines(order) {
  const scheduled = order.scheduledFor && order.scheduledFor !== ASAP_LABEL
  const lines = [
    `🧾 <b>Pedido #${esc(order.orderNumber)}</b> — Tráelo 🌐 web`,
    '',
    `👤 <b>Cliente:</b> ${esc(order.customerName)}`,
    `📍 <b>Dirección:</b> ${esc(order.customerAddress)}`,
    ...(order.addressReference ? [`🧭 <b>Referencia:</b> ${esc(order.addressReference)}`] : []),
    `📞 <b>Teléfono:</b> ${esc(order.customerPhone)}`,
    scheduled
      ? `⚠️⏰ <b>ENTREGA: ${esc(String(order.scheduledFor).toUpperCase())}</b>`
      : `🕒 <b>Entrega:</b> ${esc(order.scheduledFor || ASAP_LABEL)}`,
    '',
  ]

  for (const group of order.businesses ?? []) {
    lines.push(`🏪 <b>${esc(group.businessName)}</b>`)
    for (const item of group.items ?? []) {
      const units = Number(item.unitsPerPack) > 1 ? Number(item.unitsPerPack) : 1
      const qty = Number(item.quantity) || 0
      const detail = units > 1 ? `${qty * units} u (${qty} caja${qty === 1 ? '' : 's'} × ${units})` : `× ${qty}`
      let name = item.productName
      if (item.optionName) name += ` (${item.optionName})`
      if (item.addonName) name += ` + ${item.addonName}`
      if (item.packagingName) name += ` [${item.packagingName}]`
      const total = Number(item.subtotal || 0) + Number(item.packagingFee || 0)
      lines.push(`   • ${esc(name)} ${detail} — ${cup(total)}`)
    }
    lines.push(`   <i>Subtotal: ${cup(group.subtotal)}</i>`)
    lines.push('')
  }

  lines.push(`🛵 <b>Mensajería:</b> ${cup(order.deliveryFee)}`)
  if (Number(order.platformFee) > 0) lines.push(`🧾 <b>Servicio Tráelo:</b> ${cup(order.platformFee)}`)
  if (Number(order.pointsDiscount) > 0) lines.push(`🎁 <b>Descuento con puntos:</b> −${cup(order.pointsDiscount)}`)
  lines.push(`💵 <b>Total: ${cup(order.total)}</b>`)
  lines.push('')
  lines.push('<i>Pedido ya registrado en el sistema (dashboard).</i>')
  return lines
}

function parseBody(req) {
  let body = req.body
  if (Buffer.isBuffer(body)) body = body.toString('utf8')
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return null
    }
  }
  return body
}

/**
 * Handler de /api/order-notify. `sent` recuerda (por instancia) los pedidos ya avisados para que un
 * reintento del navegador devuelva el mismo número de sorteo en vez de mandar otro vale.
 */
export function createNotifyHandler({ env = () => process.env, now = () => Date.now(), sent = new Map() } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    const reply = (status, payload) => res.status(status).json(payload)

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return reply(405, { ok: false, error: 'method_not_allowed' })
    }

    const vars = env()
    const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = vars
    const backend = backendConfig(vars)
    if (!token || !chatId || !backend.apiKey) return reply(500, { ok: false, error: 'server_misconfigured' })

    const body = parseBody(req)
    const orderId = typeof body?.orderId === 'string' && /^[a-z0-9]{8,40}$/i.test(body.orderId) ? body.orderId : null
    const guestToken = typeof body?.guestToken === 'string' && body.guestToken.length >= 16 && body.guestToken.length <= 200 ? body.guestToken : null
    if (!orderId || !guestToken) return reply(400, { ok: false, error: 'invalid_request' })

    if (sent.has(orderId)) return reply(200, { ok: true, raffleNumber: sent.get(orderId) })

    const order = await fetchGuestOrder(backend, orderId, guestToken)
    if (!order) return reply(404, { ok: false, error: 'order_not_found' })
    if (order.source !== 'WEB') return reply(409, { ok: false, error: 'not_a_web_order' })
    const createdAt = Date.parse(order.createdAt)
    if (!Number.isFinite(createdAt) || now() - createdAt > MAX_ORDER_AGE_MS) {
      return reply(409, { ok: false, error: 'order_too_old' })
    }

    const result = await deliverOrder({ token, chatId, chunks: chunkLines(buildBackendOrderLines(order)) })
    if (!result.ok) return reply(502, { ok: false, error: 'telegram_failed' })
    sent.set(orderId, result.raffleNumber ?? null)
    return reply(200, { ok: true, raffleNumber: result.raffleNumber ?? null })
  }
}
