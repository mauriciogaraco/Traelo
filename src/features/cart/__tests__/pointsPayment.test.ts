import { canAddUnit, estimateAllProductsInPoints, estimatePointsCost, payAllWithPoints, sanitizeUnits, unitPointsEstimate } from '../pointsPayment'
import { lineIdOf } from '../lines'
import type { CartItem } from '../../../store/cartStore'

const item = (productId: string, price: number, quantity: number, extra: Partial<CartItem> = {}): CartItem => ({
  productId,
  businessId: 'b',
  quantity,
  nameSnapshot: productId,
  priceSnapshot: price,
  imageUrlSnapshot: null,
  ...extra,
})

describe('pago con puntos (estimado, 1 punto = 1 CUP)', () => {
  const items = [item('pizza', 400, 2), item('cafe', 100, 3)]

  it('una unidad cuesta su precio en puntos, con el agrego por unidad de caja', () => {
    expect(unitPointsEstimate(items[0]!)).toBe(400)
    expect(unitPointsEstimate(item('caja', 720, 1, { formatoSnapshot: 24, addonPriceSnapshot: 10 }))).toBe(960)
  })

  it('el envase NO entra: los puntos cubren solo el producto', () => {
    expect(unitPointsEstimate(item('x', 200, 1, { packagingName: 'Caja', packagingPriceSnapshot: 150 }))).toBe(200)
  })

  it('costo de lo elegido y de pagar todo el pedido', () => {
    const units = { [lineIdOf(items[0]!)]: 1, [lineIdOf(items[1]!)]: 2 }
    expect(estimatePointsCost(items, units)).toBe(400 + 200)
    expect(estimateAllProductsInPoints(items)).toBe(400 * 2 + 100 * 3)
  })

  it('unidades inválidas se corrigen: no más que la cantidad y solo líneas que siguen en el carrito', () => {
    expect(sanitizeUnits(items, { pizza: 9, cafe: -1, fantasma: 2 })).toEqual({ pizza: 2 })
  })

  it('"pagar todo" llena en orden con unidades enteras mientras alcance el saldo', () => {
    expect(payAllWithPoints(items, 2000)).toEqual({ pizza: 2, cafe: 3 })
    // 900 puntos: 2 pizzas = 800, quedan 100 → 1 café
    expect(payAllWithPoints(items, 900)).toEqual({ pizza: 2, cafe: 1 })
    expect(payAllWithPoints(items, 50)).toEqual({})
  })

  it('el botón + se bloquea al llegar a la cantidad o al saldo', () => {
    expect(canAddUnit(items[0]!, {}, items, 500)).toBe(true)
    expect(canAddUnit(items[0]!, { pizza: 1 }, items, 500)).toBe(false); // 2.ª pizza = 800 > 500
    expect(canAddUnit(items[1]!, { cafe: 3 }, items, 5000)).toBe(false); // ya son las 3
  })
})
