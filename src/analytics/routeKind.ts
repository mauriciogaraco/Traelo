/**
 * De dónde viene una visita a un negocio o producto ("source"): la pantalla anterior dentro de la
 * web. Sin pantalla anterior (se abrió el enlace directo) es 'directo'.
 */
export type RouteKind = 'home' | 'buscar' | 'categorias' | 'favoritos' | 'negocio' | 'producto' | 'carrito' | 'pedido' | 'otro' | 'directo'

export function routeKind(pathname: string | null): RouteKind {
  if (pathname === null) return 'directo'
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/buscar')) return 'buscar'
  if (pathname.startsWith('/categorias')) return 'categorias'
  if (pathname.startsWith('/favoritos')) return 'favoritos'
  if (pathname.startsWith('/negocio/')) return 'negocio'
  if (pathname.startsWith('/producto/')) return 'producto'
  if (pathname.startsWith('/carrito') || pathname.startsWith('/checkout')) return 'carrito'
  if (pathname.startsWith('/pedido')) return 'pedido'
  return 'otro'
}

let previousPath: string | null = null
let currentPath: string | null = null

/** La llama el componente que sigue la ruta (antes de que corran los efectos de las pantallas). */
export function recordRoute(pathname: string): void {
  if (pathname === currentPath) return
  previousPath = currentPath
  currentPath = pathname
}

/** Tipo de la pantalla desde la que se llegó a la actual. */
export function sourceOfCurrentRoute(): RouteKind {
  return routeKind(previousPath)
}
