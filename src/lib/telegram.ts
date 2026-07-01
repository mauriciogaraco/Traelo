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
    `🕒 <b>Entrega:</b> ${esc(order.delivery ?? 'Lo antes posible')}`,
    '',
  ]

  let cupTotal = 0
  let usdTotal = 0
  const hasUsd = groups.some(g => businessById(g.businessId)?.currency === 'USD')

  for (const group of groups) {
    const currency = businessById(group.businessId)?.currency
    const isUsd = currency === 'USD'

    lines.push(`🏪 <b>${esc(group.businessName)}</b>${isUsd ? ' 💲' : ''}`)

    for (const item of group.items) {
      const { product, quantity, option, addon, packaging } = item
      const detalle = hasFormato(product)
        ? `${unitsOf(item)} u (${quantity} caja${quantity > 1 ? 's' : ''} × ${packSize(product)})`
        : `× ${quantity}`
      let nombre = product.name
      if (option) nombre += ` (${option})`
      if (addon) nombre += ` + ${addon.name}`
      if (packaging) nombre += ` [${packaging.name}]`
      const precio = formatPrice(lineTotal(item), isUsd ? 'USD' : undefined)
      lines.push(`   • ${esc(nombre)} ${detalle} — ${precio}`)
    }

    lines.push(`   <i>Subtotal: ${formatPrice(group.subtotal, isUsd ? 'USD' : undefined)}</i>`)
    lines.push('')

    if (isUsd) usdTotal += group.subtotal
    else cupTotal += group.subtotal
  }

  const fee = order.fee ?? 0
  lines.push(`🛵 <b>Mensajería:</b> ${formatPrice(fee)} <i>(siempre en CUP)</i>`)

  if (hasUsd) {
    if (usdTotal > 0)
      lines.push(`💲 <b>Productos USD: ${formatPrice(usdTotal, 'USD')}</b>`)
    if (cupTotal > 0)
      lines.push(`💵 <b>Productos CUP: ${formatPrice(cupTotal)}</b>`)
    lines.push(`💵 <b>Mensajería a cobrar: ${formatPrice(fee)}</b>`)
    lines.push(`<i>⚠️ La mensajería se cobra en CUP aunque no se retenga la prenda.</i>`)
  } else {
    lines.push(`💵 <b>Total: ${formatPrice(cupTotal + fee)}</b>`)
  }

  return lines.join('\n')
}

export async function sendOrderToTelegram(order: Order): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: buildOrderMessage(order),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    const data = await res.json().catch(() => null)
    return res.ok && data?.ok === true
  } catch {
    return false
  }
}
