// Tests de /api/order-notify sin tocar Telegram ni el backend: fetch queda simulado.
import { buildBackendOrderLines, createNotifyHandler } from './notify.js'

const NOW = Date.parse('2026-09-25T18:00:00Z')

function makeOrder(overrides = {}) {
  return {
    id: 'cmorder000000000000000001',
    orderNumber: 1234,
    source: 'WEB',
    createdAt: new Date(NOW - 60_000).toISOString(),
    customerName: 'Ana <b>Pérez</b>',
    customerPhone: '+5351234567',
    customerAddress: 'Calle 1 #23',
    addressReference: 'Casa azul',
    scheduledFor: 'Hoy 7:30 pm',
    deliveryFee: 250,
    platformFee: 60,
    pointsDiscount: 0,
    total: 1510,
    businesses: [
      {
        businessName: 'Cronos',
        subtotal: 1200,
        items: [
          { productName: 'Batido', quantity: 2, unitPrice: 500, subtotal: 1000, optionName: 'Fresa', addonName: 'Crema', packagingName: 'Vaso', packagingFee: 200, unitsPerPack: 1 },
        ],
      },
    ],
    ...overrides,
  }
}

function makeRes() {
  const res = { statusCode: 0, body: null, headers: {} }
  res.setHeader = (k, v) => (res.headers[k] = v)
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

function setup({ order = makeOrder(), backendStatus = 200 } = {}) {
  const telegram = []
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    if (u.includes('/guest/orders/')) {
      if (init.headers['X-Guest-Token'] !== 'token-valido-1234567890') return new Response('{}', { status: 404 })
      return Response.json({ data: order }, { status: backendStatus })
    }
    if (u.includes('api.telegram.org')) {
      const body = JSON.parse(init.body)
      telegram.push({ method: u.split('/').pop(), body })
      return Response.json({ ok: true, result: { message_id: 7000 + telegram.length } })
    }
    throw new Error(`fetch inesperado: ${u}`)
  }
  const handler = createNotifyHandler({
    env: () => ({ TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: 'c', VITE_API_URL: 'https://backend.test', VITE_API_KEY: 'k' }),
    now: () => NOW,
  })
  const call = async (body) => {
    const res = makeRes()
    await handler({ method: 'POST', body }, res)
    return res
  }
  return { call, telegram }
}

describe('/api/order-notify', () => {
  it('lee el pedido real del backend, lo envía a Telegram y no menciona el sorteo', async () => {
    const { call, telegram } = setup()
    const res = await call({ orderId: 'cmorder000000000000000001', guestToken: 'token-valido-1234567890' })
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.raffleNumber).toBeUndefined()
    expect(telegram.filter((t) => t.method === 'sendMessage').length).toBe(1)
    expect(telegram.some((t) => t.method === 'editMessageText')).toBe(false)
    const sent = telegram.find((t) => t.method === 'sendMessage').body.text
    expect(sent.toLowerCase()).not.toContain('sorteo')
    expect(sent).toContain('Pedido #1234')
    expect(sent).toContain('ENTREGA: HOY 7:30 PM')
    expect(sent).toContain('Batido (Fresa) + Crema [Vaso] × 2 — 1,200 CUP'.replace('1,200', (1200).toLocaleString('es-CU')))
    // El nombre se escapa: nada de HTML inyectado en el vale.
    expect(sent).toContain('Ana &lt;b&gt;Pérez&lt;/b&gt;')
  })

  it('un reintento del mismo pedido no manda otro vale', async () => {
    const { call, telegram } = setup()
    const body = { orderId: 'cmorder000000000000000001', guestToken: 'token-valido-1234567890' }
    await call(body)
    const count = telegram.length
    const second = await call(body)
    expect(second.statusCode).toBe(200)
    expect(telegram.length).toBe(count)
  })

  it('rechaza tokens inválidos, pedidos que no son de la web y pedidos viejos', async () => {
    expect((await setup().call({ orderId: 'cmorder000000000000000001', guestToken: 'otro-token-1234567890' })).statusCode).toBe(404)
    expect((await setup({ order: makeOrder({ source: 'APP' }) }).call({ orderId: 'cmorder000000000000000001', guestToken: 'token-valido-1234567890' })).statusCode).toBe(409)
    const old = makeOrder({ createdAt: new Date(NOW - 60 * 60_000).toISOString() })
    expect((await setup({ order: old }).call({ orderId: 'cmorder000000000000000001', guestToken: 'token-valido-1234567890' })).statusCode).toBe(409)
    expect((await setup().call({ orderId: '../x', guestToken: 'token-valido-1234567890' })).statusCode).toBe(400)
  })
})

describe('buildBackendOrderLines', () => {
  it('muestra las cajas con sus unidades y "Lo antes posible" sin alarma', () => {
    const lines = buildBackendOrderLines(
      makeOrder({
        scheduledFor: 'Lo antes posible',
        businesses: [{ businessName: 'Mercado', subtotal: 6480, items: [{ productName: 'Jugo', quantity: 1, subtotal: 6480, unitsPerPack: 27 }] }],
      }),
    ).join('\n')
    expect(lines).toContain('Jugo 27 u (1 caja × 27)')
    expect(lines).toContain('🕒 <b>Entrega:</b> Lo antes posible')
    expect(lines).not.toContain('⚠️⏰')
  })
})
