import type { CatalogBusiness } from '../../types/backend/catalog'

/**
 * Enlaces cortos de negocio: /negocio/la-marina en vez del id largo del backend. El slug sale del
 * nombre (sin tildes ni símbolos, y sin lo que va tras un guion: "La Pino - Tienda de Alimentos" →
 * "la-pino"). Los enlaces con el id viejo siguen abriendo el negocio (y pasan al enlace corto).
 */

export function slugify(name: string): string {
  const base = name.split(/\s+-\s+/)[0] ?? name
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'negocio'
}

const cache = new WeakMap<CatalogBusiness[], Map<string, string>>()

/**
 * id → slug de cada negocio. Si dos comparten nombre, el de id menor se queda con el slug limpio y
 * los demás llevan -2, -3… (el orden por id no cambia al sincronizar, así el enlace es estable).
 */
export function businessSlugs(businesses: CatalogBusiness[]): Map<string, string> {
  const cached = cache.get(businesses)
  if (cached) return cached

  const used = new Set<string>()
  const slugs = new Map<string, string>()
  for (const business of [...businesses].sort((a, b) => a.id.localeCompare(b.id))) {
    const base = slugify(business.name)
    let slug = base
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`
    used.add(slug)
    slugs.set(business.id, slug)
  }
  cache.set(businesses, slugs)
  return slugs
}

/** Ruta del negocio; si todavía no está en el catálogo, usa el id (la página lo resuelve igual). */
export function businessPath(businessId: string, businesses: CatalogBusiness[]): string {
  return `/negocio/${businessSlugs(businesses).get(businessId) ?? businessId}`
}

/** Negocio al que apunta el último tramo del enlace: su id del backend o su slug. */
export function findBusinessByParam(param: string, businesses: CatalogBusiness[]): CatalogBusiness | undefined {
  const byId = businesses.find((business) => business.id === param)
  if (byId) return byId
  const slugs = businessSlugs(businesses)
  return businesses.find((business) => slugs.get(business.id) === param.toLowerCase())
}
