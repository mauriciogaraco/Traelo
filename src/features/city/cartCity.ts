import type { CartChangeDetail } from '../../types/backend/order'

/** Código con el que el servidor rechaza un pedido cuyos negocios son de distintas localidades. */
export const MIXED_CITY_CODE = 'MIXED_CITY_BUSINESSES'

export function mixedCityMessage(cityName?: string): string {
  return `Tu carrito tiene negocios de distintas localidades y un pedido solo puede ser de una${
    cityName ? ` (ahora compras desde ${cityName})` : ''
  }. Cada localidad guarda su propio carrito: quita lo que no sea de esta.`
}

/**
 * Líneas del carrito cuyo negocio NO está en el catálogo de la localidad activa (que el servidor ya
 * filtró). Es la barrera del cliente contra un carrito de otra localidad — el servidor vuelve a validar
 * al cotizar y al crear el pedido (`MIXED_CITY_BUSINESSES`); esto solo evita ir y volver a la red.
 * Devuelve cada negocio una sola vez.
 */
export function businessIdsOutsideCatalog(
  items: ReadonlyArray<{ businessId: string }>,
  catalogBusinesses: ReadonlyArray<{ id: string }>,
): string[] {
  const inCatalog = new Set(catalogBusinesses.map((business) => business.id))
  return [...new Set(items.map((item) => item.businessId))].filter((id) => !inCatalog.has(id))
}

/** Los mismos negocios, como avisos del carrito: se marcan en pantalla y "Quitar lo que no está disponible" los quita. */
export function outsideCityIssues(businessIds: string[], cityName: string): CartChangeDetail[] {
  return businessIds.map((businessId) => ({
    type: 'business' as const,
    businessId,
    reason: 'BUSINESS_NOT_FOUND' as const,
    message: `Este negocio no está disponible en ${cityName}.`,
  }))
}
