import type { Business, Category } from '../types'

export const categories: Category[] = ['Alimentos', 'Bebidas', 'Aseo', 'Comida', 'Confituras', 'Ropa']

export const categoryEmoji: Record<Category, string> = {
  Alimentos: '🥫',
  Bebidas: '🥤',
  Aseo: '🧼',
  Comida: '🍽️',
  Confituras: '🍯',
  Ropa: '👗',
}

// Populated by CatalogContext once the JSON loads.
let _businesses: Business[] = []

export function _setBusinessCache(businesses: Business[]) {
  _businesses = businesses
}

export function businessById(id: string): Business | undefined {
  return _businesses.find((b) => b.id === id)
}
