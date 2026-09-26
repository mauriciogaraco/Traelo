import { addFavoriteBusiness, addFavoriteProduct, removeFavoriteBusiness, removeFavoriteProduct } from '../../api/customerFavorites'
import { useFavoritesStore } from '../../store/favoritesStore'
import type { CatalogBusiness, CatalogProduct } from '../../types/backend/catalog'
import { toggleFavoriteBusiness, toggleFavoriteProduct } from '../favoritesService'

vi.mock('../../api/customerFavorites')

const addBusiness = vi.mocked(addFavoriteBusiness)
const removeBusiness = vi.mocked(removeFavoriteBusiness)
const addProduct = vi.mocked(addFavoriteProduct)
const removeProduct = vi.mocked(removeFavoriteProduct)

const business = { id: 'b1', name: 'Cronos', phone: '+5355550000', address: 'Calle 1' } as CatalogBusiness
const product = { id: 'p1', businessId: 'b1', name: 'Batido', price: 900 } as CatalogProduct

beforeEach(() => {
  vi.clearAllMocks()
  useFavoritesStore.getState().clear()
})

describe('favoritos de negocios (optimista)', () => {
  it('agrega: el store cambia antes de confirmar y se queda si el backend responde', async () => {
    addBusiness.mockResolvedValueOnce({} as never)
    const pending = toggleFavoriteBusiness(business)
    expect(useFavoritesStore.getState().businesses.map((b) => b.businessId)).toEqual(['b1'])
    await expect(pending).resolves.toBe('added')
    expect(addBusiness).toHaveBeenCalledWith('b1')
  })

  it('agrega y el backend falla: revierte y avisa "failed"', async () => {
    addBusiness.mockRejectedValueOnce(new Error('red'))
    await expect(toggleFavoriteBusiness(business)).resolves.toBe('failed')
    expect(useFavoritesStore.getState().businesses).toEqual([])
  })

  it('quita: usa la ruta de borrado; si falla, lo vuelve a poner', async () => {
    useFavoritesStore.getState().addBusiness({ businessId: 'b1', name: 'Cronos', phone: '', address: '', createdAt: '' })
    removeBusiness.mockResolvedValueOnce(undefined)
    await expect(toggleFavoriteBusiness(business)).resolves.toBe('removed')
    expect(useFavoritesStore.getState().businesses).toEqual([])

    useFavoritesStore.getState().addBusiness({ businessId: 'b1', name: 'Cronos', phone: '', address: '', createdAt: '' })
    removeBusiness.mockRejectedValueOnce(new Error('red'))
    await expect(toggleFavoriteBusiness(business)).resolves.toBe('failed')
    expect(useFavoritesStore.getState().businesses.map((b) => b.businessId)).toEqual(['b1'])
  })
})

describe('favoritos de productos (optimista)', () => {
  it('agrega con nombre y precio, y quita', async () => {
    addProduct.mockResolvedValueOnce({} as never)
    await expect(toggleFavoriteProduct(product)).resolves.toBe('added')
    expect(useFavoritesStore.getState().products[0]).toMatchObject({ productId: 'p1', businessId: 'b1', name: 'Batido', price: 900 })

    removeProduct.mockResolvedValueOnce(undefined)
    await expect(toggleFavoriteProduct(product)).resolves.toBe('removed')
    expect(useFavoritesStore.getState().products).toEqual([])
  })

  it('si el backend falla al agregar o quitar, deja el store como estaba', async () => {
    addProduct.mockRejectedValueOnce(new Error('red'))
    await expect(toggleFavoriteProduct(product)).resolves.toBe('failed')
    expect(useFavoritesStore.getState().products).toEqual([])

    useFavoritesStore.getState().addProduct({ productId: 'p1', businessId: 'b1', name: 'Batido', price: 900, createdAt: '' })
    removeProduct.mockRejectedValueOnce(new Error('red'))
    await expect(toggleFavoriteProduct(product)).resolves.toBe('failed')
    expect(useFavoritesStore.getState().products.map((p) => p.productId)).toEqual(['p1'])
  })
})
