import type { Order } from '../types'
import { formatPrice } from './format'
import { groupByBusiness } from './order'
import { hasFormato, lineTotal, packSize, unitsOf } from './cart'
import { businessById } from '../data/catalog'
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './config'

/** Escapa los caracteres reservados de HTML para Telegram (parse_mode=HTML). */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Número de sorteo: la app no tiene backend propio, así que no hay ningún
 * contador compartido "de verdad" entre los teléfonos de todos los clientes.
 * En vez de inventar uno en el cliente (que repetiría números entre
 * personas distintas), se usa el `message_id` que Telegram asigna al
 * mandar el pedido — lo asignan los servidores de Telegram, así que es
 * único y siempre creciente sin importar desde qué teléfono se pida.
 * Puede tener saltos si alguien del staff escribe en el mismo grupo, pero
 * nunca se repite. RAFFLE_OFFSET se restó una vez (mensaje de calibración
 * #5692, enviado y borrado el 2026-09-17) para que el primer pedido
 * numerado salga cerca de #1 en vez de heredar el historial del chat.
 */
const RAFFLE_OFFSET = 5692
const RAFFLE_PRIZE_LABEL = '15 mil CUP'
const RAFFLE_DEADLINE_LABEL = 'lunes 26 de septiembre'
const RAFFLE_VIDEO_URL = 'https://www.facebook.com/share/r/19TzbgCpV9/'

function buildRaffleFooter(ticketNumber: number): string {
  return [
    '',
    `🎟️ <b>Número del Sorteo: #${ticketNumber}</b>`,
    '',
    `🎉 Recuerda que el sorteo por los ${RAFFLE_PRIZE_LABEL} en premio ya está activo hasta el ${RAFFLE_DEADLINE_LABEL}. Guarda este vale como prueba de que estás participando.`,
    '',
    `Más información en este video: ${RAFFLE_VIDEO_URL}`,
  ].join('\n')
}

async function callTelegram(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok && data?.ok === true, data }
}

export function buildOrderMessage(order: Order): string {
  const { id, address } = order
  const groups = groupByBusiness(order.items)

  const lines: string[] = [
    `🧾 <b>Pedido #${esc(id)}</b> — Tráelo`,
    '',
    `👤 <b>Cliente:</b> ${esc(address.nombre)} ${esc(address.apellidos)}`,
    `📍 <b>Dirección:</b> ${esc(address.direccion)}`,
    ...(address.referencia ? [`🧭 <b>Referencia:</b> ${esc(address.referencia)}`] : []),
    `📞 <b>Teléfono:</b> ${esc(address.telefono)}`,
    order.delivery && order.delivery !== 'Lo antes posible'
      ? `⚠️⏰ <b>ENTREGA: ${esc(order.delivery.toUpperCase())}</b>`
      : `🕒 <b>Entrega:</b> ${esc('Lo antes posible')}`,
    '',
  ]

  let cupTotal = 0
  let usdTotal = 0
  const hasUsd = groups.some(g =>
    businessById(g.businessId)?.currency === 'USD' ||
    g.items.some(i => i.product.currency === 'USD')
  )
  const hasEmePolicy = groups.some(g => businessById(g.businessId)?.currency === 'USD')

  for (const group of groups) {
    const groupIsUsd = businessById(group.businessId)?.currency === 'USD'

    lines.push(`🏪 <b>${esc(group.businessName)}</b>${groupIsUsd ? ' 💲' : ''}`)

    let grpCup = 0
    let grpUsd = 0
    for (const item of group.items) {
      const { product, quantity, option, addon, packaging } = item
      const itemIsUsd = product.currency === 'USD' || groupIsUsd
      const detalle = hasFormato(product)
        ? `${unitsOf(item)} u (${quantity} caja${quantity > 1 ? 's' : ''} × ${packSize(product)})`
        : `× ${quantity}`
      let nombre = product.name
      if (option) nombre += ` (${option})`
      if (addon) nombre += ` + ${addon.name}`
      if (packaging) nombre += ` [${packaging.name}]`
      const precio = formatPrice(lineTotal(item), itemIsUsd ? 'USD' : undefined)
      lines.push(`   • ${esc(nombre)} ${detalle} — ${precio}`)
      if (itemIsUsd) { grpUsd += lineTotal(item); usdTotal += lineTotal(item) }
      else { grpCup += lineTotal(item); cupTotal += lineTotal(item) }
    }

    const subtotalLine = grpUsd > 0 && grpCup > 0
      ? `${formatPrice(grpCup)} + ${formatPrice(grpUsd, 'USD')}`
      : grpUsd > 0 ? formatPrice(grpUsd, 'USD') : formatPrice(grpCup)
    lines.push(`   <i>Subtotal: ${subtotalLine}</i>`)
    lines.push('')
  }

  const fee = order.fee ?? 0
  const serviceFee = order.serviceFee ?? 0
  lines.push(`🛵 <b>Mensajería:</b> ${formatPrice(fee)} <i>(siempre en CUP)</i>`)
  if (serviceFee > 0)
    lines.push(`🧾 <b>Servicio Tráelo:</b> ${formatPrice(serviceFee)} <i>(siempre en CUP)</i>`)

  if (hasUsd) {
    // Mensajería y servicio ya se listaron arriba; aquí solo los totales por moneda
    // (sin volver a repetirlos), para que quede claro cuánto cobrar en cada una.
    if (cupTotal > 0)
      lines.push(`💵 <b>Productos CUP: ${formatPrice(cupTotal)}</b>`)
    if (usdTotal > 0)
      lines.push(`💲 <b>Total USD a cobrar: ${formatPrice(usdTotal, 'USD')}</b>`)
    lines.push(`💵 <b>Total CUP a cobrar: ${formatPrice(cupTotal + fee + serviceFee)}</b>`)
    if (hasEmePolicy)
      lines.push(`<i>⚠️ La mensajería se cobra en CUP aunque no se retenga la prenda.</i>`)
  } else {
    lines.push(`💵 <b>Total: ${formatPrice(cupTotal + fee + serviceFee)}</b>`)
  }

  return lines.join('\n')
}

export interface SendOrderResult {
  ok: boolean
  /** Presente cuando el pedido queda con número de sorteo (nuevo o ya lo traía). */
  raffleNumber?: number
}

export async function sendOrderToTelegram(order: Order): Promise<SendOrderResult> {
  try {
    const baseText = buildOrderMessage(order)

    // Reenvío de un pedido que ya tiene número: se reutiliza el mismo,
    // un solo mensaje (no hace falta editar nada).
    if (order.raffleNumber !== undefined) {
      const sent = await callTelegram('sendMessage', {
        chat_id: TELEGRAM_CHAT_ID,
        text: baseText + buildRaffleFooter(order.raffleNumber),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
      return { ok: sent.ok, raffleNumber: order.raffleNumber }
    }

    // Pedido nuevo: se manda primero sin número (para saber qué message_id
    // le asigna Telegram) y luego se edita para añadir el número de sorteo.
    const sent = await callTelegram('sendMessage', {
      chat_id: TELEGRAM_CHAT_ID,
      text: baseText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })
    if (!sent.ok) return { ok: false }

    const messageId: number | undefined = sent.data?.result?.message_id
    if (messageId === undefined) return { ok: true }

    const raffleNumber = messageId - RAFFLE_OFFSET
    await callTelegram('editMessageText', {
      chat_id: TELEGRAM_CHAT_ID,
      message_id: messageId,
      text: baseText + buildRaffleFooter(raffleNumber),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })
    // El pedido ya llegó con el sendMessage inicial; si la edición falla,
    // igual se considera enviado (solo faltaría el número en el mensaje).
    return { ok: true, raffleNumber }
  } catch {
    return { ok: false }
  }
}
