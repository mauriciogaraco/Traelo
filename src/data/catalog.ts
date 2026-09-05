import type { Business, Category, BusinessCategory } from '../types'

export const categories: Category[] = ['Alimentos', 'Bebidas', 'Aseo', 'Comida', 'Confituras', 'Ropa', 'Electrónica']

export const categoryEmoji: Record<Category, string> = {
  Alimentos: '🥫',
  Bebidas: '🥤',
  Aseo: '🧼',
  Comida: '🍽️',
  Confituras: '🍯',
  Ropa: '👗',
  Electrónica: '⚡',
}

/** Categorías de negocio (sección "Categorías" del bottom nav), Destacados primero. */
export const businessCategories: BusinessCategory[] = [
  'Destacados',
  'Restaurantes',
  'Mercado',
  'Pizzas',
  'Bebidas',
  'Helados',
  'Panes',
  'Asados',
  'Dulces',
  'Ropa',
  'Ferretería',
]

export const businessCategoryEmoji: Record<BusinessCategory, string> = {
  Destacados: '🌟',
  Restaurantes: '🍽️',
  Mercado: '🛒',
  Pizzas: '🍕',
  Bebidas: '🥤',
  Helados: '🍦',
  Panes: '🍞',
  Asados: '🔥',
  Dulces: '🍬',
  Ropa: '👗',
  Ferretería: '🔧',
}

/**
 * Al entrar en una categoría de negocio, acota los productos de cada negocio a
 * los que calcen con alguno de estos valores de `Product.category` (texto libre
 * en los datos). Si una categoría no tiene pista aquí (ej: Restaurantes,
 * Destacados — demasiado amplias), se muestran todos los productos del negocio.
 */
export const productCategoryHints: Partial<Record<BusinessCategory, string[]>> = {
  Pizzas: ['Pizzas'],
  Helados: ['Helados'],
  Panes: ['Panes', 'Panadería'],
  Dulces: ['Dulces', 'Dulcería', 'Cakes', 'Confituras', 'Postres'],
  Bebidas: ['Bebidas', 'Coctelería', 'Batidos', 'Malteadas', 'Café', 'Líneas de Ron', 'Líneas de Whisky'],
  Asados: ['Carnes', 'Res', 'Cerdo', 'Pollo', 'Del Mar'],
  Ferretería: ['Herramientas', 'Materiales', 'Electricidad', 'Fontanería', 'Cerrajería', 'Discos y Corte', 'Menaje'],
  Ropa: ['Ropa'],
}

// Populated by CatalogContext once the JSON loads.
let _businesses: Business[] = []

export function _setBusinessCache(businesses: Business[]) {
  _businesses = businesses
}

export function businessById(id: string): Business | undefined {
  return _businesses.find((b) => b.id === id)
}
