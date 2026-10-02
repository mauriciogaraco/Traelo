import type { IconName } from '../ui/Icon'

/**
 * Pestañas principales — las mismas 5 que la app móvil (`app/(tabs)/_layout.tsx`), con Home al
 * centro. "Mi cuenta" no es una pestaña: vive en el header, igual que en mobile.
 */
export interface NavTab {
  to: string
  label: string
  icon: IconName
  /** Pestaña del carrito: lleva el contador y es el destino de la animación "volar al carrito". */
  cart?: boolean
}

export const NAV_TABS: NavTab[] = [
  { to: '/categorias', label: 'Categorías', icon: 'grid' },
  { to: '/buscar', label: 'Buscar', icon: 'search' },
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/ayuda', label: 'Ayuda', icon: 'help' },
  { to: '/carrito', label: 'Carrito', icon: 'cart', cart: true },
]

export function isTabActive(tab: NavTab, pathname: string): boolean {
  return tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)
}

/**
 * Pantallas "de flujo" (en mobile son pantallas apiladas fuera de las pestañas, con su propio
 * botón de volver): en teléfono/tablet ocultan la barra flotante y el header. En escritorio el
 * header siempre se ve.
 */
const FLOW_PREFIXES = ['/producto/', '/checkout']

export function isFlowRoute(pathname: string): boolean {
  return FLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function cartBadge(count: number): string {
  return count > 9 ? '9+' : String(count)
}
