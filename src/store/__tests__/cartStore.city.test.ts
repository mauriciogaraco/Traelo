import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogProduct } from '../../types/backend/catalog'

// zustand/persist usa localStorage; el entorno de tests es node.
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
})
const { useCartStore } = await import('../cartStore')

const product = (id: string, businessId: string): CatalogProduct =>
  ({
    id,
    businessId,
    name: `Producto ${id}`,
    price: 100,
    effectivePrice: 100,
    imageUrl: null,
    imageBlurhash: null,
    available: true,
    packaging: null,
    formato: null,
  }) as unknown as CatalogProduct

const GUIRA = 'guira-de-melena'
const SAN_ANTONIO = 'san-antonio-de-los-banos'

beforeEach(() => {
  memory.clear()
  useCartStore.setState({ items: [], carts: {}, activeCityCode: GUIRA, checkoutIssues: [] })
})

describe('carrito por ciudad', () => {
  it('cambiar de ciudad guarda el carrito de la anterior y muestra solo el de la nueva', () => {
    const cart = useCartStore.getState()
    cart.addItem(product('p1', 'b-guira'))
    cart.addItem(product('p2', 'b-guira'), 2)

    useCartStore.getState().switchCity(SAN_ANTONIO)

    expect(useCartStore.getState().activeCityCode).toBe(SAN_ANTONIO)
    expect(useCartStore.getState().items).toEqual([]) // el contador y el carrito son del ámbito actual
    expect(useCartStore.getState().carts[GUIRA]).toHaveLength(2)
  })

  it('al volver a una ciudad se restaura su carrito tal como estaba (nada se pierde en silencio)', () => {
    useCartStore.getState().addItem(product('p1', 'b-guira'), 3)
    useCartStore.getState().switchCity(SAN_ANTONIO)
    useCartStore.getState().addItem(product('s1', 'b-sa'))

    useCartStore.getState().switchCity(GUIRA)

    expect(useCartStore.getState().items.map((i) => [i.productId, i.quantity])).toEqual([['p1', 3]])
    expect(useCartStore.getState().carts[SAN_ANTONIO].map((i) => i.productId)).toEqual(['s1'])
  })

  it('un carrito nunca mezcla ciudades: lo que se agrega va solo al de la ciudad activa', () => {
    useCartStore.getState().switchCity(SAN_ANTONIO)
    useCartStore.getState().addItem(product('s1', 'b-sa'))
    const ids = useCartStore.getState().items.map((i) => i.businessId)
    expect(new Set(ids)).toEqual(new Set(['b-sa']))
    expect(useCartStore.getState().carts[GUIRA]).toBeUndefined()
  })

  it('cambiar a la misma ciudad no toca nada', () => {
    useCartStore.getState().addItem(product('p1', 'b-guira'))
    const before = useCartStore.getState()
    useCartStore.getState().switchCity(GUIRA)
    expect(useCartStore.getState().items).toBe(before.items)
  })

  it('vaciar el carrito (p. ej. tras un pedido) solo vacía el de la ciudad activa', () => {
    useCartStore.getState().addItem(product('p1', 'b-guira'))
    useCartStore.getState().switchCity(SAN_ANTONIO)
    useCartStore.getState().addItem(product('s1', 'b-sa'))
    useCartStore.getState().clearCart()
    useCartStore.getState().switchCity(GUIRA)
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(['p1'])
  })

  it('un carrito de antes de la expansión (solo items) sigue siendo de Güira', async () => {
    memory.set('traelo.cart.v1', JSON.stringify({ state: { items: [{ productId: 'p1', businessId: 'b', quantity: 2, nameSnapshot: 'x', priceSnapshot: 1, imageUrlSnapshot: null }] }, version: 0 }))
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().activeCityCode).toBe(GUIRA)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().carts).toEqual({})
  })
})
