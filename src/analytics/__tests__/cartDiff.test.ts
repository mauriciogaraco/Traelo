import type { CartItem } from '../../store/cartStore'
import { diffCartItems } from '../cartDiff'

function item(overrides: Partial<CartItem> & Pick<CartItem, 'productId'>): CartItem {
  return {
    businessId: 'b1',
    quantity: 1,
    nameSnapshot: 'Producto',
    priceSnapshot: 500,
    imageUrlSnapshot: null,
    ...overrides,
  }
}

describe('diffCartItems', () => {
  it('un producto nuevo es add_to_cart con su cantidad y precio', () => {
    const changes = diffCartItems([], [item({ productId: 'p1', quantity: 2, priceSnapshot: 700 })])
    expect(changes).toEqual([{ type: 'add_to_cart', productId: 'p1', businessId: 'b1', quantity: 2, price: 700 }])
  })

  it('subir la cantidad cuenta solo la diferencia', () => {
    const changes = diffCartItems([item({ productId: 'p1', quantity: 2 })], [item({ productId: 'p1', quantity: 5 })])
    expect(changes).toEqual([{ type: 'add_to_cart', productId: 'p1', businessId: 'b1', quantity: 3, price: 500 }])
  })

  it('bajar la cantidad o quitar la línea es remove_from_cart', () => {
    expect(diffCartItems([item({ productId: 'p1', quantity: 3 })], [item({ productId: 'p1', quantity: 1 })])).toEqual([
      { type: 'remove_from_cart', productId: 'p1', businessId: 'b1', quantity: 2, price: 500 },
    ])
    expect(diffCartItems([item({ productId: 'p1', quantity: 3 })], [])).toEqual([
      { type: 'remove_from_cart', productId: 'p1', businessId: 'b1', quantity: 3, price: 500 },
    ])
  })

  it('sin cambios no hay eventos (p. ej. solo se actualizó el precio guardado)', () => {
    expect(diffCartItems([item({ productId: 'p1', priceSnapshot: 500 })], [item({ productId: 'p1', priceSnapshot: 600 })])).toEqual([])
  })

  it('el mismo producto con otro tipo/sabor es otra línea', () => {
    const changes = diffCartItems(
      [item({ productId: 'p1', optionName: 'Fresa' })],
      [item({ productId: 'p1', optionName: 'Fresa' }), item({ productId: 'p1', optionName: 'Vainilla' })],
    )
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ type: 'add_to_cart', productId: 'p1', quantity: 1 })
  })

  it('vaciar un carrito de varias líneas quita cada una', () => {
    const changes = diffCartItems([item({ productId: 'p1' }), item({ productId: 'p2', businessId: 'b2' })], [])
    expect(changes.map((c) => [c.type, c.productId, c.businessId])).toEqual([
      ['remove_from_cart', 'p1', 'b1'],
      ['remove_from_cart', 'p2', 'b2'],
    ])
  })
})
