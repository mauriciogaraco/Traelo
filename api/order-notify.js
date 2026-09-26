// Función serverless de Vercel: avisa al grupo de Telegram de un pedido que la web ya creó en el
// backend. Lee el pedido real del backend (ver _lib/notify.js). Variables en Vercel:
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID y la URL/API key del backend (VITE_API_URL/VITE_API_KEY o
// TRAELO_API_URL/TRAELO_API_KEY).
import { createNotifyHandler } from './_lib/notify.js'

export default createNotifyHandler()
