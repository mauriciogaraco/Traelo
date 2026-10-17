import type { CatalogBusiness, CatalogProduct } from '../../types/backend/catalog'

/**
 * `/catalog/featured-products` (y `/catalog/stats`) no filtran por ciudad en el servidor: devuelven
 * productos de toda la plataforma. Con 2+ localidades se dejan solo los que pertenecen a un negocio
 * del catálogo ACTIVO (ese sí lo filtra el servidor), así un destacado de otra localidad nunca se
 * ofrece como disponible en la actual. No es una regla comercial: es el catálogo autoritativo
 * decidiendo qué existe aquí.
 */
export function onlyProductsOfBusinesses(products: CatalogProduct[], businesses: CatalogBusiness[]): CatalogProduct[] {
  const ids = new Set(businesses.map((business) => business.id))
  return products.filter((product) => ids.has(product.businessId))
}
