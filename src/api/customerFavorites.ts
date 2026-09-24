import { apiDelete, apiGet, apiPost } from './client';
import type { FavoriteBusiness, FavoriteProduct } from '../types/backend/customer';

const AUTH = { auth: true } as const;

export function listFavoriteBusinesses() {
  return apiGet<FavoriteBusiness[]>('/customers/me/favorites/businesses', undefined, AUTH);
}

export function addFavoriteBusiness(businessId: string) {
  return apiPost<FavoriteBusiness>(`/customers/me/favorites/businesses/${businessId}`, undefined, AUTH);
}

export function removeFavoriteBusiness(businessId: string) {
  return apiDelete(`/customers/me/favorites/businesses/${businessId}`, AUTH);
}

export function listFavoriteProducts() {
  return apiGet<FavoriteProduct[]>('/customers/me/favorites/products', undefined, AUTH);
}

export function addFavoriteProduct(productId: string) {
  return apiPost<FavoriteProduct>(`/customers/me/favorites/products/${productId}`, undefined, AUTH);
}

export function removeFavoriteProduct(productId: string) {
  return apiDelete(`/customers/me/favorites/products/${productId}`, AUTH);
}
