import type { Order } from '../types'
import { formatPrice } from './format'
import { groupByBusiness } from './order'
import { hasFormato, lineTotal, packSize, unitsOf } from './cart'
import {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  MESSAGING_FEE,
  MESSAGING_FREE,
} from './config'

/** Escapa los caracteres reservados de HTML para Telegram (parse_mode=HTML). */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Construye el mensaje del pedido en HTML, ORGANIZADO POR NEGOCIO:
 *
 *   Pedido #1234
 *   Cliente / Dirección / Teléfono
 *
 *   🏪 Negocio A
 *   • Producto x 2 — 100 CUP
 *   🏪 Negocio B
 *   • Producto x 1 — 50 CUP
 *
 *   Total
 */
export function buildOrderMessage(order: Order): string {
  const { id, address, total } = order
  const groups = groupByBusiness(order.items)

  const lines: string[] = [
    `🧾 <b>Pedido #${esc(id)}</b> — Tráelo`,
    '',
    `👤 <b>Cliente:</b> ${esc(address.nombre)} ${esc(address.apellidos)}`,
    `📍 <b>Dirección:</b> ${esc(address.direccion)}`,
    ...(address.referencia ? [`🧭 <b>Referencia:</b> ${esc(address.referencia)}`] : []),
    `📞 <b>Teléfono:</b> ${esc(address.telefono)}`,
    '',
  ]

  for (const group of groups) {
    lines.push(`🏪 <b>${esc(group.businessName)}</b>`)
    for (const item of group.items) {
      const { product, quantity, option } = item
      const detalle = hasFormato(product)
        ? `${unitsOf(item)} u (${quantity} caja${quantity > 1 ? 's' : ''} × ${packSize(product)})`
        : `× ${quantity}`
      const nombre = option ? `${product.name} (${option})` : product.name
      lines.push(`   • ${esc(nombre)} ${detalle} — ${formatPrice(lineTotal(item))}`)
    }
    lines.push(`   <i>Subtotal: ${formatPrice(group.subtotal)}</i>`)
    lines.push('')
  }

  lines.push(`🛵 <b>Mensajería:</b> ${MESSAGING_FREE ? `Gratis (lanzamiento) — antes ${formatPrice(MESSAGING_FEE)}` : formatPrice(MESSAGING_FEE)}`)
  lines.push(`💵 <b>Total: ${formatPrice(total)}</b>`)

  return lines.join('\n')
}

/**
 * Envía el pedido al chat de Telegram configurado.
 * Devuelve true si Telegram confirma el envío, false en cualquier error.
 */
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
