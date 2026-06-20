import type { Order } from '../types'
import { formatPrice } from './format'
import { groupByBusiness } from './order'
import { hasFormato, lineTotal, packSize, unitsOf } from './cart'
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './config'

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildOrderMessage(order: Order): string {
  const { id, address, total } = order
  const groups = groupByBusiness(order.items)

  const lines: string[] = [
    `🎁 <b>Pedido #${esc(id)}</b> — Tráelo Familia`,
    '',
    `👤 <b>Comprador:</b> ${esc(address.nombreComprador)}`,
    `📱 <b>WhatsApp:</b> ${esc(address.whatsappComprador)}`,
    '',
    `📦 <b>Para:</b> ${esc(address.nombreDestinatario)}`,
    `📍 <b>Dirección:</b> ${esc(address.direccion)}`,
    ...(address.observaciones ? [`📝 <b>Observaciones:</b> ${esc(address.observaciones)}`] : []),
    '',
  ]

  for (const group of groups) {
    lines.push(`🏪 <b>${esc(group.businessName)}</b>`)
    for (const item of group.items) {
      const { product, quantity, option, addon, packaging } = item
      const detalle = hasFormato(product)
        ? `${unitsOf(item)} u (${quantity} caja${quantity > 1 ? 's' : ''} × ${packSize(product)})`
        : `× ${quantity}`
      let nombre = product.name
      if (option) nombre += ` (${option})`
      if (addon) nombre += ` + ${addon.name}`
      if (packaging) nombre += ` [${packaging.name}]`
      lines.push(`   • ${esc(nombre)} ${detalle} — ${formatPrice(lineTotal(item))}`)
    }
    lines.push(`   <i>Subtotal: ${formatPrice(group.subtotal)}</i>`)
    lines.push('')
  }

  const subtotalVal = order.subtotal ?? total
  const zelleCommission = Math.round(subtotalVal * 0.10 * 100) / 100
  const zelleTotalVal = Math.round((subtotalVal + zelleCommission) * 100) / 100

  lines.push(`💵 Subtotal: ${formatPrice(subtotalVal)} USD`)
  lines.push(`➕ Comisión Zelle (10%): ${formatPrice(zelleCommission)} USD`)
  lines.push(`💳 <b>Total Zelle: ${formatPrice(zelleTotalVal)} USD</b>`)
  lines.push('')
  lines.push(`📲 <i>Coordinar pago por WhatsApp</i>`)

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
