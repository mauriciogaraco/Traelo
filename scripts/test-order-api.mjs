// Prueba del endpoint /api/order SIN tocar Telegram: fetch queda simulado.
// Uso: node scripts/test-order-api.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'
import { createHandler, createCatalogLoader, USD_EXCHANGE_RATE, FEE_BASE } from '../api/_lib/core.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const readData = (f) => JSON.parse(readFileSync(join(ROOT, 'public', 'data', f), 'utf8'))
const products = readData('search-index.json')
const businesses = readData('businesses.json')

// ── fetch simulado ────────────────────────────────────────────────────────────
const telegramCalls = []
let telegramMode = 'ok'
let nextMessageId = 6000
globalThis.fetch = async (url, init = {}) => {
  const u = String(url)
  if (u.endsWith('/data/search-index.json')) return Response.json(products)
  if (u.endsWith('/data/businesses.json')) return Response.json(businesses)
  if (u.includes('api.telegram.org')) {
    telegramCalls.push({ url: u, body: JSON.parse(init.body) })
    if (telegramMode === 'fail') return Response.json({ ok: false, description: 'boom' }, { status: 500 })
    return Response.json({ ok: true, result: { message_id: nextMessageId++ } })
  }
  throw new Error(`fetch inesperado: ${u}`)
}

// Token y chat FALSOS, solo para esta prueba.
const ENV = { TELEGRAM_BOT_TOKEN: 'TEST_TOKEN_NOT_REAL', TELEGRAM_CHAT_ID: '-100TEST' }
const makeHandler = (env = ENV) =>
  createHandler({
    loadCatalog: createCatalogLoader({ baseUrl: () => 'http://catalog.test' }),
    env: () => env,
  })

function call(handler, { method = 'POST', body, ip = '1.1.1.1', ua = 'TestUA/1.0' } = {}) {
  return new Promise((resolve) => {
    const res = {
      headers: {},
      statusCode: 200,
      setHeader(k, v) { this.headers[k] = v },
      status(c) { this.statusCode = c; return this },
      json(p) { resolve({ status: this.statusCode, body: p, headers: this.headers }) },
    }
    handler({ method, body, headers: { 'x-forwarded-for': `${ip}, 10.0.0.1`, 'user-agent': ua } }, res)
  })
}

const address = { nombre: 'Ana', apellidos: 'Pérez', telefono: '5551234', direccion: 'Calle 1 #2', referencia: 'Frente al parque' }
const find = (pred) => products.find((p) => p.stockStatus !== 'agotado' && pred(p))
const simple = find((p) => !p.options && !p.addons && !p.packaging && !p.currency && !(p.formato > 1) && businesses.find((b) => b.id === p.businessId)?.currency !== 'USD')
const usd = products.find((p) => p.id === 'lr-016')
const soldOut = products.find((p) => p.stockStatus === 'agotado')
const withOption = find((p) => p.options?.length)
const withAddon = find((p) => p.addons?.length)
const validBody = (over = {}) => ({ id: '4821', address, items: [{ product: { id: simple.id }, quantity: 2 }], delivery: { scheduled: false }, ...over })

let passed = 0
const test = async (name, fn) => {
  try {
    await fn()
    passed++
    console.log(`  ok   ${name}`)
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`)
    process.exitCode = 1
  }
}

console.log('Pruebas de /api/order (Telegram simulado)')

await test('constantes de precios iguales a las del cliente', () => {
  const config = readFileSync(join(ROOT, 'src/lib/config.ts'), 'utf8')
  const fees = readFileSync(join(ROOT, 'src/lib/fees.ts'), 'utf8')
  assert.equal(Number(config.match(/USD_EXCHANGE_RATE\s*=\s*(\d+)/)[1]), USD_EXCHANGE_RATE)
  assert.equal(Number(fees.match(/FEE_BASE\s*=\s*(\d+)/)[1]), FEE_BASE)
})

await test('pedido válido: 200, mensaje completo, sin IP ni dispositivo, número de sorteo', async () => {
  telegramCalls.length = 0
  const r = await call(makeHandler(), { body: validBody() })
  assert.equal(r.status, 200)
  assert.equal(r.body.ok, true)
  assert.equal(r.body.raffleNumber, 6000 - 5692)
  assert.equal(r.headers['Cache-Control'], 'no-store')
  assert.equal(telegramCalls.length, 2) // sendMessage + editMessageText
  const text = telegramCalls[0].body.text
  assert.match(text, /Pedido #4821/)
  assert.match(text, new RegExp(simple.name.replace(/[()]/g, '\\$&')))
  assert.ok(!text.includes('1.1.1.1'), 'la IP no debe aparecer en el mensaje')
  assert.ok(!/IP/.test(text), 'no debe haber línea de IP')
  assert.ok(!text.includes('TestUA'), 'el dispositivo (user agent) no debe aparecer en el mensaje')
  assert.ok(!/Dispositivo/.test(text), 'no debe haber línea de dispositivo')
  assert.ok(telegramCalls[0].url.includes('/botTEST_TOKEN_NOT_REAL/sendMessage'))
  assert.equal(telegramCalls[0].body.chat_id, '-100TEST')
  assert.match(telegramCalls[1].body.text, /Número del Sorteo: #308/)
})

await test('los precios enviados por el cliente se ignoran', async () => {
  telegramCalls.length = 0
  const body = validBody({ items: [{ product: { id: simple.id, price: 1 }, price: 1, quantity: 1 }], total: 1, fee: 0, serviceFee: 0 })
  const r = await call(makeHandler(), { body })
  assert.equal(r.status, 200)
  const text = telegramCalls[0].body.text
  const expected = `${simple.price.toLocaleString('es-CU')} CUP`
  assert.ok(text.includes(expected), `debería contener ${expected}`)
  assert.ok(!/— 1 CUP/.test(text))
})

await test('pedido en USD: mensajería y servicio una sola vez + totales por moneda', async () => {
  telegramCalls.length = 0
  const r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: usd.id }, quantity: 1 }] }) })
  assert.equal(r.status, 200)
  const text = telegramCalls[0].body.text
  assert.equal((text.match(/Mensajería:/g) ?? []).length, 1)
  assert.equal((text.match(/Servicio Tráelo:/g) ?? []).length, 1)
  assert.match(text, /Total USD a cobrar: \$ 200 USD/)
  assert.match(text, /Total CUP a cobrar: 1,750 CUP/)
})

await test('producto inexistente -> 400', async () => {
  const r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: 'no-existe-999' }, quantity: 1 }] }) })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'unknown_product')
})

await test('producto agotado -> 400', async () => {
  const r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: soldOut.id }, quantity: 1 }] }) })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'out_of_stock')
})

for (const [label, quantity] of [['1000', 1000], ['100', 100], ['0', 0], ['-3', -3], ['2.5', 2.5], ['"5"', '5'], ['null', null]]) {
  await test(`cantidad absurda (${label}) -> 400`, async () => {
    const r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: simple.id }, quantity }] }) })
    assert.equal(r.status, 400)
    assert.equal(r.body.error, 'invalid_quantity')
  })
}

await test('opción inexistente -> 400 y opción válida -> 200', async () => {
  let r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: withOption.id }, quantity: 1, option: 'NO-EXISTE' }] }) })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'invalid_option')
  r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: withOption.id }, quantity: 1, option: withOption.options[0] }] }) })
  assert.equal(r.status, 200)
})

await test('agrego y envase inexistentes -> 400', async () => {
  let r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: withAddon.id }, quantity: 1, addon: { name: 'NO-EXISTE' } }] }) })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'invalid_addon')
  r = await call(makeHandler(), { body: validBody({ items: [{ product: { id: simple.id }, quantity: 1, packaging: { name: 'Fantasma' } }] }) })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'invalid_packaging')
})

await test('más de 60 líneas -> 400', async () => {
  const items = Array.from({ length: 61 }, () => ({ product: { id: simple.id }, quantity: 1 }))
  const r = await call(makeHandler(), { body: validBody({ items }) })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'too_many_lines')
})

await test('60 líneas -> 200 y el vale se parte en varios mensajes < 4096', async () => {
  telegramCalls.length = 0
  const long = products.filter((p) => p.stockStatus !== 'agotado' && !p.options && !p.addons && !p.packaging && !p.currency).sort((a, b) => b.name.length - a.name.length)
  const items = Array.from({ length: 60 }, (_, i) => ({ product: { id: long[i % 20].id }, quantity: 1 }))
  const r = await call(makeHandler(), { body: validBody({ items }) })
  assert.equal(r.status, 200)
  for (const c of telegramCalls) assert.ok(c.body.text.length <= 4096, `mensaje de ${c.body.text.length} caracteres`)
})

await test('textos vacíos o demasiado largos -> 400', async () => {
  for (const [field, value] of [['nombre', ''], ['nombre', '   '], ['nombre', 'x'.repeat(101)], ['apellidos', 'x'.repeat(101)], ['telefono', 'x'.repeat(31)], ['direccion', ''], ['direccion', 'x'.repeat(301)], ['referencia', 'x'.repeat(501)]]) {
    const r = await call(makeHandler(), { body: validBody({ address: { ...address, [field]: value } }) })
    assert.equal(r.status, 400, `${field}=${JSON.stringify(value).slice(0, 12)}`)
  }
  const ok = await call(makeHandler(), { body: validBody({ address: { ...address, nombre: 'x'.repeat(100), telefono: 'x'.repeat(30), direccion: 'x'.repeat(300), referencia: 'x'.repeat(500) } }) })
  assert.equal(ok.status, 200)
})

await test('HTML y saltos de línea del usuario se escapan / neutralizan', async () => {
  telegramCalls.length = 0
  const r = await call(makeHandler(), { body: validBody({ address: { ...address, nombre: '<b>Hack</b> & co', direccion: 'Calle\n💵 Total: 1 CUP' } }) })
  assert.equal(r.status, 200)
  const text = telegramCalls[0].body.text
  assert.ok(text.includes('&lt;b&gt;Hack&lt;/b&gt; &amp; co'))
  assert.ok(!text.includes('<b>Hack</b>'))
  assert.ok(text.includes('Calle 💵 Total: 1 CUP')) // en una sola línea, sin imitar un total
})

await test('sin límite por IP: muchos pedidos seguidos desde la misma IP pasan (IP compartida en Cuba)', async () => {
  const handler = makeHandler()
  for (let i = 0; i < 5; i++) {
    const r = await call(handler, { body: validBody({ id: String(1000 + i) }), ip: '9.9.9.9' })
    assert.equal(r.status, 200, `pedido ${i + 1}`)
  }
})

await test('pedido inválido -> 400 y el siguiente válido pasa', async () => {
  const handler = makeHandler()
  assert.equal((await call(handler, { body: validBody({ items: [] }) })).status, 400)
  assert.equal((await call(handler, { body: validBody() })).status, 200)
})

await test('si Telegram falla -> 502 y se puede reintentar de inmediato', async () => {
  const handler = makeHandler()
  telegramMode = 'fail'
  assert.equal((await call(handler, { body: validBody() })).status, 502)
  telegramMode = 'ok'
  assert.equal((await call(handler, { body: validBody() })).status, 200)
})

await test('reenvío con número de sorteo: un solo mensaje, sin edición, mismo número', async () => {
  telegramCalls.length = 0
  const r = await call(makeHandler(), { body: validBody({ raffleNumber: 123 }) })
  assert.equal(r.status, 200)
  assert.equal(r.body.raffleNumber, 123)
  assert.equal(telegramCalls.length, 1)
  assert.match(telegramCalls[0].body.text, /Número del Sorteo: #123/)
})

await test('sin variables de entorno -> 500 (sin filtrar detalles)', async () => {
  const r = await call(makeHandler({}), { body: validBody() })
  assert.equal(r.status, 500)
  assert.equal(r.body.error, 'server_misconfigured')
})

await test('método distinto de POST -> 405', async () => {
  const r = await call(makeHandler(), { method: 'GET' })
  assert.equal(r.status, 405)
  assert.equal(r.headers.Allow, 'POST')
})

await test('cuerpo inválido -> 400', async () => {
  const handler = makeHandler()
  assert.equal((await call(handler, { body: 'esto no es json' })).status, 400)
  assert.equal((await call(handler, { body: null })).status, 400)
  assert.equal((await call(handler, { body: [] })).status, 400)
})

console.log(`\n${passed} pruebas pasaron${process.exitCode ? ' — HAY FALLOS' : ''}`)
