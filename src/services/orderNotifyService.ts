/**
 * Aviso del pedido al grupo de Telegram del equipo (se mantiene mientras el equipo lo use, además
 * del dashboard). Lo envía la función de Vercel `/api/order-notify`, que NO confía en lo que mande
 * el navegador: con el id y el token de invitado lee el pedido real del backend y arma el vale con
 * esos datos.
 *
 * Nunca lanza: el pedido ya existe en el sistema; si el aviso falla solo falta el mensaje.
 */
export async function notifyOrderToTelegram(orderId: string, guestToken: string): Promise<void> {
  try {
    await fetch('/api/order-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, guestToken }),
    })
  } catch {
    // sin aviso: el pedido ya existe en el backend
  }
}
