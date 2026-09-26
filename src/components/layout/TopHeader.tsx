import { Link, NavLink, useLocation } from 'react-router-dom'
import { getCartItemCount } from '../../features/cart'
import { useCartStore } from '../../store/cartStore'
import { useAuth } from '../../hooks/useAuth'
import { AddressBar } from '../address/AddressBar'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import { NAV_TABS, cartBadge, isTabActive } from './navigation'

/**
 * Header compartido — `TopHeader` de la app móvil: logo, dirección de entrega y "Mi cuenta".
 * En escritorio (lg+) suma la navegación principal y el carrito, que en teléfono van en la barra
 * flotante.
 *
 * "Mi cuenta" lleva a `/cuenta`: con sesión muestra la inicial del nombre; sin sesión, el ícono.
 * Pendiente: campana de notificaciones.
 */
export function TopHeader({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  const { pathname } = useLocation()
  const itemCount = useCartStore((state) => getCartItemCount(state.items))
  const { isAuthenticated, customer } = useAuth()
  // En escritorio el orden es el habitual de la web (Inicio primero); en la barra flotante Home va al centro.
  const desktopTabs = [...NAV_TABS.filter((tab) => tab.to === '/'), ...NAV_TABS.filter((tab) => tab.to !== '/' && !tab.cart)]
  const cartTab = NAV_TABS.find((tab) => tab.cart)!

  return (
    <header
      className={`sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top,0px)] ${
        hideOnMobile ? 'hidden lg:block' : ''
      }`}
    >
      <div className="mx-auto w-full max-w-6xl flex items-center gap-2 lg:gap-6 px-4 lg:px-6 py-2 lg:py-3">
        <Link to="/" aria-label="Tráelo, inicio" className="shrink-0">
          <Logo size="md" className="lg:hidden" />
          <Logo size="sm" showWordmark className="hidden lg:inline-flex" />
        </Link>

        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1">
          {desktopTabs.map((tab) => {
            const active = isTabActive(tab, pathname)
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-primary-soft text-primary-text'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }`}
              >
                <Icon name={tab.icon} size={18} filled={active} />
                {tab.label === 'Home' ? 'Inicio' : tab.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0 lg:max-w-xs lg:ml-auto">
          <AddressBar />
        </div>

        <Link
          to={cartTab.to}
          aria-label={itemCount > 0 ? `Carrito, ${itemCount} productos` : 'Carrito'}
          className="hidden lg:flex relative w-10 h-10 shrink-0 rounded-full bg-primary-soft text-primary items-center justify-center hover:brightness-95 transition"
        >
          <span data-cart-target="">
            <Icon name="cart" size={22} filled={isTabActive(cartTab, pathname)} />
          </span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-info text-white text-[10px] font-bold flex items-center justify-center">
              {cartBadge(itemCount)}
            </span>
          )}
        </Link>

        <Link
          to="/cuenta"
          aria-label={isAuthenticated ? `Mi cuenta: ${customer?.name ?? ''}` : 'Mi cuenta: iniciar sesión'}
          className="w-10 h-10 shrink-0 rounded-full bg-gradient-primary text-white flex items-center justify-center font-bold hover:brightness-105 transition"
        >
          {isAuthenticated && customer?.name ? (
            <span aria-hidden="true">{customer.name.trim().charAt(0).toUpperCase()}</span>
          ) : (
            <Icon name="person" size={20} filled />
          )}
        </Link>
      </div>
    </header>
  )
}
