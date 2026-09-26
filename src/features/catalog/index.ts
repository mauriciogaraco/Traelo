export * from './search'
export * from './businessStatus'
export * from './ranking'
export * from './categoryVisual'
export * from './legacyLinks'

/** ¿Agotado? (`available: false`). Sin el campo —catálogo de antes o servidor viejo— se considera disponible. */
export const isSoldOut = (product: { available?: boolean }): boolean => product.available === false
