import { useGuestOrdersStore } from '../store/guestStore'

/**
 * Aviso del pedido al grupo de Telegram del equipo (se mantiene mientras el equipo lo use, además
 * del dashboard). Lo envía la función de Vercel `/api/order-notify`, que NO confía en lo que mande
 * el navegador: con el id y el token de invitado lee el pedido real del backend y arma el vale con
 * esos datos. Devuelve el número del sorteo (si el aviso salió) y lo guarda junto al pedido.
 *
 * Nunca lanza: el pedido ya existe en el sistema; si el aviso falla solo falta el mensaje.
 */
export async function notifyOrderToTelegram(orderId: string, guestToken: string): Promise<number | null> {
  try {
    const res = await fetch('/api/order-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, guestToken }),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; raffleNumber?: number } | null
    const raffleNumber = res.ok && data?.ok && typeof data.raffleNumber === 'number' ? data.raffleNumber : null
    if (raffleNumber !== null) useGuestOrdersStore.getState().update(orderId, { raffleNumber })
    return raffleNumber
  } catch {
    return null
  }
}
