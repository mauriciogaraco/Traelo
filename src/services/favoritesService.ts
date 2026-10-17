import {
  addFavoriteBusiness,
  addFavoriteProduct,
  listFavoriteBusinesses,
  listFavoriteProducts,
  removeFavoriteBusiness,
  removeFavoriteProduct,
} from '../api/customerFavorites'
import { track } from '../analytics'
import { useFavoritesStore } from '../store/favoritesStore'
import type { CatalogBusiness, CatalogProduct } from '../types/backend/catalog'

export async function loadFavorites(): Promise<void> {
  const [businesses, products] = await Promise.all([listFavoriteBusinesses(), listFavoriteProducts()])
  useFavoritesStore.getState().setFavorites({ businesses, products })
}

/** Qué pasó: la pantalla lo traduce a un aviso (toast). */
export type FavoriteToggleResult = 'added' | 'removed' | 'failed'

const businessFavorite = (business: CatalogBusiness) => ({
  businessId: business.id,
  name: business.name,
  phone: business.phone,
  address: business.address,
  createdAt: new Date().toISOString(),
})

const productFavorite = (product: CatalogProduct) => ({
  productId: product.id,
  businessId: product.businessId,
  name: product.name,
  price: product.price,
  createdAt: new Date().toISOString(),
})

/** Optimista: actualiza el store antes de confirmar con el backend y revierte si falla. */
export async function toggleFavoriteBusiness(business: CatalogBusiness): Promise<FavoriteToggleResult> {
  const store = useFavoritesStore.getState()
  const isFavorite = store.businesses.some((b) => b.businessId === business.id)

  if (isFavorite) {
    store.removeBusiness(business.id)
    try {
      await removeFavoriteBusiness(business.id)
      track('favorite_removed', { businessId: business.id })
      return 'removed'
    } catch {
      store.addBusiness(businessFavorite(business))
      return 'failed'
    }
  }

  store.addBusiness(businessFavorite(business))
  try {
    await addFavoriteBusiness(business.id)
    track('favorite_added', { businessId: business.id })
    return 'added'
  } catch {
    store.removeBusiness(business.id)
    return 'failed'
  }
}

export async function toggleFavoriteProduct(product: CatalogProduct): Promise<FavoriteToggleResult> {
  const store = useFavoritesStore.getState()
  const isFavorite = store.products.some((p) => p.productId === product.id)

  if (isFavorite) {
    store.removeProduct(product.id)
    try {
      await removeFavoriteProduct(product.id)
      track('favorite_removed', { productId: product.id, businessId: product.businessId })
      return 'removed'
    } catch {
      store.addProduct(productFavorite(product))
      return 'failed'
    }
  }

  store.addProduct(productFavorite(product))
  try {
    await addFavoriteProduct(product.id)
    track('favorite_added', { productId: product.id, businessId: product.businessId })
    return 'added'
  } catch {
    store.removeProduct(product.id)
    return 'failed'
  }
}
