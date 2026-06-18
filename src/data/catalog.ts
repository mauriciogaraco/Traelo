import type { Business, Category } from '../types'

export const categories: Category[] = ['Combos', 'Comidas', 'Regalos', 'Bebidas', 'Panadería']

export const categoryEmoji: Record<Category, string> = {
  Combos: '🎁',
  Comidas: '🍽️',
  Regalos: '🎂',
  Bebidas: '🍺',
  Panadería: '🥖',
}

let _businesses: Business[] = []

export function _setBusinessCache(businesses: Business[]) {
  _businesses = businesses
}

export function businessById(id: string): Business | undefined {
  return _businesses.find((b) => b.id === id)
}
