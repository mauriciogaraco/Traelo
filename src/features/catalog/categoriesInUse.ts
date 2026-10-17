import type { CatalogCategory, CatalogProduct } from '../../types/backend/catalog'

/**
 * Categorías que tienen al menos un producto en el catálogo ACTIVO (el de la localidad elegida).
 * Las categorías son globales, pero una localidad puede no tener nada en alguna: mostrarla llevaría a
 * una búsqueda vacía. Los negocios no tienen categoría propia, así que cuentan los productos.
 */
export function categoriesInUse(categories: CatalogCategory[], products: Pick<CatalogProduct, 'categoryId'>[]): CatalogCategory[] {
  const used = new Set<string>()
  for (const product of products) if (product.categoryId) used.add(product.categoryId)
  return categories.filter((category) => used.has(category.id))
}
