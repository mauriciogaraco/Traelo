// Lógica del endpoint /api/order (validación, precios, mensaje y límites).
// Está separada del handler para poder probarla sin Vercel. La carpeta _lib
// no se expone como ruta: Vercel ignora los archivos que empiezan con "_".
//
// IMPORTANTE: el cálculo de precios (lineTotal, mensajería, servicio) replica
// src/lib/cart.ts, src/lib/fees.ts y src/lib/config.ts. Si cambias esas reglas
// en el cliente hay que cambiarlas aquí también (scripts/test-order-api.mjs
// comprueba que las constantes sigan iguales).

// ── Constantes ────────────────────────────────────────────────────────────────
export const FEE_BASE = 250
export const LATE_HOUR = 19
export const FEE_LATE_SURCHARGE = 100
export const MULTI_BUSINESS_SURCHARGE = 100
export const FEE_BULK_THRESHOLD = 10_000
export const FEE_BULK_SURCHARGE = 100
export const USD_EXCHANGE_RATE = 700

export const LIMITS = {
  maxLines: 60,
  maxQuantity: 99,
  nombre: 100,
  apellidos: 100,
  telefono: 30,
  direccion: 300,
  referencia: 500,
}

export const CATALOG_TTL_MS = 5 * 60 * 1000
const FALLBACK_SITE_URL = 'https://www.traelo-market.com'
const TELEGRAM_TIMEOUT_MS = 8000
const CATALOG_TIMEOUT_MS = 5000
// Telegram admite 4096 caracteres por mensaje; se deja margen para el pie
// del sorteo que se añade al último trozo.
const CHUNK_LIMIT = 3400

// Número de sorteo: se usa el message_id que Telegram asigna al mensaje
// (único y creciente) menos un offset de calibración. Ver historial de git.
const RAFFLE_OFFSET = 5692
const RAFFLE_PRIZE_LABEL = '15 mil CUP'
const RAFFLE_DEADLINE_LABEL = 'lunes 26 de septiembre'
const RAFFLE_VIDEO_URL = 'https://www.facebook.com/share/r/19TzbgCpV9/'

// ── Utilidades ────────────────────────────────────────────────────────────────
class HttpError extends Error {
  constructor(status, code, message) {
    super(message ?? code)
    this.status = status
    this.code = code
  }
}

export function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Quita caracteres de control y colapsa espacios (evita colar saltos de línea que imiten otras líneas del vale). */
function cleanText(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function requireText(value, field, max, { optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return ''
    throw new HttpError(400, 'invalid_field', `${field} es obligatorio`)
  }
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_field', `${field} no es válido`)
  const text = cleanText(value)
  if (!text) {
    if (optional) return ''
    throw new HttpError(400, 'invalid_field', `${field} es obligatorio`)
  }
  if (text.length > max) throw new HttpError(400, 'field_too_long', `${field} supera ${max} caracteres`)
  return text
}

export function formatPrice(value, currency) {
  if (currency === 'USD') return `$ ${value.toLocaleString('es-CU')} USD`
  return `${value.toLocaleString('es-CU')} CUP`
}

export function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`
}

/** Hora (0-23) en Cuba: el servidor corre en UTC, y la tarifa nocturna depende de la hora local. */
export function havanaHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Havana', hour: '2-digit', hourCycle: 'h23' }).format(date),
  )
}

// ── Precios (réplica de src/lib/cart.ts y src/lib/fees.ts) ────────────────────
const packSize = (product) => (product.formato && product.formato > 1 ? product.formato : 1)

export function lineTotal(item) {
  const units = item.quantity * packSize(item.product)
  const basePerUnit = item.product.price + (item.addon?.price ?? 0)
  const capacity = item.packaging?.capacity
  const packagingCount = !item.packaging ? 0 : capacity && capacity > 0 ? Math.ceil(units / capacity) : item.quantity
  return basePerUnit * units + (item.packaging?.price ?? 0) * packagingCount
}

export function isUsdItem(item, businessesById) {
  return (item.product.currency ?? businessesById.get(item.product.businessId)?.currency) === 'USD'
}

export function computeFee(items, businessesById, hour) {
  if (items.length === 0) return 0
  const businessIds = [...new Set(items.map((i) => i.product.businessId))]
  const base = Math.max(...businessIds.map((id) => businessesById.get(id)?.deliveryFee ?? FEE_BASE))
  const lateSurcharge = hour >= LATE_HOUR ? FEE_LATE_SURCHARGE : 0
  const multiSurcharge = businessIds.length > 1 ? (businessIds.length - 1) * MULTI_BUSINESS_SURCHARGE : 0
  const cupSubtotal = items.filter((i) => !isUsdItem(i, businessesById)).reduce((s, i) => s + lineTotal(i), 0)
  const bulkSurcharge = base === FEE_BASE && cupSubtotal > FEE_BULK_THRESHOLD ? FEE_BULK_SURCHARGE : 0
  return base + lateSurcharge + multiSurcharge + bulkSurcharge
}

export function computeServiceFee(items, businessesById) {
  const cup = new Map()
  const usd = new Map()
  for (const item of items) {
    const map = isUsdItem(item, businessesById) ? usd : cup
    const id = item.product.businessId
    map.set(id, (map.get(id) ?? 0) + lineTotal(item))
  }
  let raw = 0
  for (const id of new Set([...cup.keys(), ...usd.keys()])) {
    const biz = businessesById.get(id)
    const pct = (biz?.businessCommission ?? 0) + (biz?.clientCommission ?? 0)
    raw += ((cup.get(id) ?? 0) * pct) / 100
    raw += (((usd.get(id) ?? 0) * pct) / 100) * USD_EXCHANGE_RATE
  }
  return Math.ceil(raw / 10) * 10
}

// ── Catálogo (se descarga del propio sitio y se cachea 5 min) ─────────────────
export function catalogBaseUrl(env = process.env) {
  if (env.CATALOG_BASE_URL) return env.CATALOG_BASE_URL.replace(/\/$/, '')
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return FALLBACK_SITE_URL
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await globalThis.fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export function createCatalogLoader({ baseUrl = () => catalogBaseUrl(), ttlMs = CATALOG_TTL_MS, now = () => Date.now() } = {}) {
  let cache = null
  return async function loadCatalog() {
    if (cache && now() - cache.at < ttlMs) return cache.value
    try {
      const base = baseUrl()
      const [products, businesses] = await Promise.all([
        fetchJson(`${base}/data/search-index.json`, CATALOG_TIMEOUT_MS),
        fetchJson(`${base}/data/businesses.json`, CATALOG_TIMEOUT_MS),
      ])
      if (!Array.isArray(products) || !Array.isArray(businesses)) throw new Error('bad catalog')
      const productsById = new Map()
      for (const p of products) if (p && typeof p.id === 'string' && !productsById.has(p.id)) productsById.set(p.id, p)
      const businessesById = new Map(businesses.map((b) => [b.id, b]))
      cache = { at: now(), value: { productsById, businessesById } }
      return cache.value
    } catch {
      // Si hay un catálogo viejo en memoria, mejor usarlo que fallar.
      if (cache) return cache.value
      throw new HttpError(503, 'catalog_unavailable', 'No se pudo cargar el catálogo')
    }
  }
}

// ── Validación ────────────────────────────────────────────────────────────────
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateOrder(body, catalog) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'invalid_body', 'Cuerpo inválido')

  const rawAddress = body.address
  if (!rawAddress || typeof rawAddress !== 'object') throw new HttpError(400, 'invalid_field', 'Falta la dirección')
  const address = {
    nombre: requireText(rawAddress.nombre, 'nombre', LIMITS.nombre),
    apellidos: requireText(rawAddress.apellidos, 'apellidos', LIMITS.apellidos),
    telefono: requireText(rawAddress.telefono, 'teléfono', LIMITS.telefono),
    direccion: requireText(rawAddress.direccion, 'dirección', LIMITS.direccion),
    referencia: requireText(rawAddress.referencia, 'observaciones', LIMITS.referencia, { optional: true }),
  }

  if (!Array.isArray(body.items) || body.items.length === 0) throw new HttpError(400, 'invalid_items', 'El pedido no tiene productos')
  if (body.items.length > LIMITS.maxLines) throw new HttpError(400, 'too_many_lines', `Máximo ${LIMITS.maxLines} líneas`)

  const items = body.items.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new HttpError(400, 'invalid_items', 'Línea inválida')
    const productId = raw.product && typeof raw.product.id === 'string' ? raw.product.id : null
    const product = productId ? catalog.productsById.get(productId) : undefined
    if (!product) throw new HttpError(400, 'unknown_product', 'Producto inexistente')
    if (product.stockStatus === 'agotado') throw new HttpError(400, 'out_of_stock', `${product.name} está agotado`)
    if (!catalog.businessesById.has(product.businessId)) throw new HttpError(400, 'unknown_business', 'Negocio inexistente')

    const quantity = raw.quantity
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.maxQuantity) {
      throw new HttpError(400, 'invalid_quantity', `Cantidad inválida (1 a ${LIMITS.maxQuantity})`)
    }

    const item = { product, quantity }

    if (raw.option !== undefined && raw.option !== null && raw.option !== '') {
      if (typeof raw.option !== 'string' || !(product.options ?? []).includes(raw.option)) {
        throw new HttpError(400, 'invalid_option', `Opción inexistente en ${product.name}`)
      }
      item.option = raw.option
    }
    if (raw.addon !== undefined && raw.addon !== null) {
      const name = raw.addon && typeof raw.addon === 'object' ? raw.addon.name : undefined
      const addon = typeof name === 'string' ? (product.addons ?? []).find((a) => a.name === name) : undefined
      if (!addon) throw new HttpError(400, 'invalid_addon', `Agrego inexistente en ${product.name}`)
      item.addon = addon
    }
    if (raw.packaging !== undefined && raw.packaging !== null) {
      const name = raw.packaging && typeof raw.packaging === 'object' ? raw.packaging.name : undefined
      const packaging = typeof name === 'string' ? (product.packaging ?? []).find((p) => p.name === name) : undefined
      if (!packaging) throw new HttpError(400, 'invalid_packaging', `Envase inexistente en ${product.name}`)
      item.packaging = packaging
    }
    return item
  })

  let scheduled = false
  let time
  if (body.delivery !== undefined && body.delivery !== null) {
    if (typeof body.delivery !== 'object') throw new HttpError(400, 'invalid_delivery', 'Entrega inválida')
    scheduled = body.delivery.scheduled === true
    if (body.delivery.time !== undefined && body.delivery.time !== null) {
      if (typeof body.delivery.time !== 'string' || !HHMM.test(body.delivery.time)) {
        throw new HttpError(400, 'invalid_delivery', 'Hora de entrega inválida')
      }
      time = body.delivery.time
    }
    if (scheduled && !time) throw new HttpError(400, 'invalid_delivery', 'Falta la hora de entrega')
  }

  let raffleNumber
  if (body.raffleNumber !== undefined && body.raffleNumber !== null) {
    if (!Number.isInteger(body.raffleNumber) || body.raffleNumber < 1 || body.raffleNumber > 999_999) {
      throw new HttpError(400, 'invalid_raffle', 'Número de sorteo inválido')
    }
    raffleNumber = body.raffleNumber
  }

  const id = typeof body.id === 'string' && /^[0-9]{1,8}$/.test(body.id) ? body.id : String(Math.floor(1000 + Math.random() * 9000))

  return { id, address, items, scheduled, time, raffleNumber }
}

// ── Mensaje ───────────────────────────────────────────────────────────────────
export function buildOrderLines(order, catalog, now = new Date()) {
  const { businessesById } = catalog
  const { items, address } = order

  const hour = order.time ? Number(order.time.slice(0, 2)) : havanaHour(now)
  const fee = computeFee(items, businessesById, hour)
  const serviceFee = computeServiceFee(items, businessesById)
  const deliveryLabel = order.scheduled && order.time ? `Hoy a las ${formatTime12h(order.time)}` : 'Lo antes posible'

  const groups = new Map()
  for (const item of items) {
    const id = item.product.businessId
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id).push(item)
  }

  const lines = [
    `🧾 <b>Pedido #${esc(order.id)}</b> — Tráelo`,
    '',
    `👤 <b>Cliente:</b> ${esc(address.nombre)} ${esc(address.apellidos)}`,
    `📍 <b>Dirección:</b> ${esc(address.direccion)}`,
    ...(address.referencia ? [`🧭 <b>Referencia:</b> ${esc(address.referencia)}`] : []),
    `📞 <b>Teléfono:</b> ${esc(address.telefono)}`,
    order.scheduled ? `⚠️⏰ <b>ENTREGA: ${esc(deliveryLabel.toUpperCase())}</b>` : `🕒 <b>Entrega:</b> ${esc(deliveryLabel)}`,
    '',
  ]

  let cupTotal = 0
  let usdTotal = 0
  const hasUsd = items.some((i) => isUsdItem(i, businessesById))
  const hasEmePolicy = [...groups.keys()].some((id) => businessesById.get(id)?.currency === 'USD')

  for (const [businessId, groupItems] of groups) {
    const biz = businessesById.get(businessId)
    const groupIsUsd = biz?.currency === 'USD'
    lines.push(`🏪 <b>${esc(biz?.name ?? groupItems[0].product.businessName)}</b>${groupIsUsd ? ' 💲' : ''}`)

    let grpCup = 0
    let grpUsd = 0
    for (const item of groupItems) {
      const { product, quantity, option, addon, packaging } = item
      const itemIsUsd = isUsdItem(item, businessesById)
      const ps = packSize(product)
      const detalle = ps > 1 ? `${quantity * ps} u (${quantity} caja${quantity > 1 ? 's' : ''} × ${ps})` : `× ${quantity}`
      let nombre = product.name
      if (option) nombre += ` (${option})`
      if (addon) nombre += ` + ${addon.name}`
      if (packaging) nombre += ` [${packaging.name}]`
      const total = lineTotal(item)
      lines.push(`   • ${esc(nombre)} ${detalle} — ${formatPrice(total, itemIsUsd ? 'USD' : undefined)}`)
      if (itemIsUsd) {
        grpUsd += total
        usdTotal += total
      } else {
        grpCup += total
        cupTotal += total
      }
    }

    const subtotal = grpUsd > 0 && grpCup > 0 ? `${formatPrice(grpCup)} + ${formatPrice(grpUsd, 'USD')}` : grpUsd > 0 ? formatPrice(grpUsd, 'USD') : formatPrice(grpCup)
    lines.push(`   <i>Subtotal: ${subtotal}</i>`)
    lines.push('')
  }

  lines.push(`🛵 <b>Mensajería:</b> ${formatPrice(fee)} <i>(siempre en CUP)</i>`)
  if (serviceFee > 0) lines.push(`🧾 <b>Servicio Tráelo:</b> ${formatPrice(serviceFee)} <i>(siempre en CUP)</i>`)

  if (hasUsd) {
    if (cupTotal > 0) lines.push(`💵 <b>Productos CUP: ${formatPrice(cupTotal)}</b>`)
    if (usdTotal > 0) lines.push(`💲 <b>Total USD a cobrar: ${formatPrice(usdTotal, 'USD')}</b>`)
    lines.push(`💵 <b>Total CUP a cobrar: ${formatPrice(cupTotal + fee + serviceFee)}</b>`)
    if (hasEmePolicy) lines.push('<i>⚠️ La mensajería se cobra en CUP aunque no se retenga la prenda.</i>')
  } else {
    lines.push(`💵 <b>Total: ${formatPrice(cupTotal + fee + serviceFee)}</b>`)
  }

  return { lines, fee, serviceFee, cupTotal, usdTotal }
}

export function raffleFooter(ticketNumber) {
  return [
    '',
    `🎟️ <b>Número del Sorteo: #${ticketNumber}</b>`,
    '',
    `🎉 Recuerda que el sorteo por los ${RAFFLE_PRIZE_LABEL} en premio ya está activo hasta el ${RAFFLE_DEADLINE_LABEL}. Guarda este vale como prueba de que estás participando.`,
    '',
    `Más información en este video: ${RAFFLE_VIDEO_URL}`,
  ].join('\n')
}

/** Parte el vale en trozos de ≤ CHUNK_LIMIT caracteres cortando siempre entre líneas. */
export function chunkLines(lines, limit = CHUNK_LIMIT) {
  const chunks = []
  let current = ''
  for (const line of lines) {
    const piece = line.length > limit ? line.slice(0, limit) : line
    const next = current ? `${current}\n${piece}` : piece
    if (next.length > limit && current) {
      chunks.push(current)
      current = piece
    } else {
      current = next
    }
  }
  if (current) chunks.push(current)
  return chunks
}

// ── Telegram ──────────────────────────────────────────────────────────────────
async function callTelegram(token, method, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS)
  try {
    const res = await globalThis.fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok && data?.ok === true, data }
  } catch (err) {
    // Nunca se registra el error completo: podría incluir la URL con el token.
    console.error('telegram request failed:', err?.name ?? 'error')
    return { ok: false, data: null }
  } finally {
    clearTimeout(timer)
  }
}

/** Envía el vale (en uno o varios mensajes) y devuelve el número de sorteo. */
export async function deliverOrder({ token, chatId, chunks, raffleNumber }) {
  const send = (text) => callTelegram(token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })

  if (raffleNumber !== undefined) {
    // Reenvío: se reutiliza el número que ya tenía el pedido; sin ediciones.
    const last = chunks.length - 1
    for (let i = 0; i < chunks.length; i++) {
      const text = i === last ? chunks[i] + raffleFooter(raffleNumber) : chunks[i]
      if (!(await send(text)).ok) return { ok: false }
    }
    return { ok: true, raffleNumber }
  }

  let lastMessageId
  for (const text of chunks) {
    const sent = await send(text)
    if (!sent.ok) return { ok: false }
    lastMessageId = sent.data?.result?.message_id
  }
  if (lastMessageId === undefined) return { ok: true }

  const ticket = lastMessageId - RAFFLE_OFFSET
  await callTelegram(token, 'editMessageText', {
    chat_id: chatId,
    message_id: lastMessageId,
    text: chunks[chunks.length - 1] + raffleFooter(ticket),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
  // El pedido ya llegó; si la edición falla solo faltaría el número en el mensaje.
  return { ok: true, raffleNumber: ticket }
}

// ── Handler ───────────────────────────────────────────────────────────────────
function parseBody(req) {
  let body = req.body
  if (Buffer.isBuffer(body)) body = body.toString('utf8')
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      throw new HttpError(400, 'invalid_json', 'JSON inválido')
    }
  }
  return body
}

export function createHandler({ loadCatalog = createCatalogLoader(), env = () => process.env } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    const reply = (status, payload) => res.status(status).json(payload)

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return reply(405, { ok: false, error: 'method_not_allowed' })
    }

    const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = env()
    if (!token || !chatId) return reply(500, { ok: false, error: 'server_misconfigured' })

    try {
      const body = parseBody(req)
      const catalog = await loadCatalog()
      const order = validateOrder(body, catalog)

      const { lines } = buildOrderLines(order, catalog)
      const chunks = chunkLines(lines)

      const result = await deliverOrder({ token, chatId, chunks, raffleNumber: order.raffleNumber })
      if (!result.ok) {
        return reply(502, { ok: false, error: 'telegram_failed' })
      }
      return reply(200, { ok: true, raffleNumber: result.raffleNumber })
    } catch (err) {
      if (err instanceof HttpError) return reply(err.status, { ok: false, error: err.code, message: err.message })
      console.error('order handler error:', err?.name ?? 'error')
      return reply(500, { ok: false, error: 'internal_error' })
    }
  }
}
