// Función serverless de Vercel: recibe un pedido, lo valida contra el catálogo
// real, recalcula los precios y lo envía a Telegram. El token y el chat id
// viven solo en las variables de entorno de Vercel (TELEGRAM_BOT_TOKEN y
// TELEGRAM_CHAT_ID); nunca en el repo ni en el bundle del navegador.
import { createHandler } from './_lib/core.js'

export default createHandler()
