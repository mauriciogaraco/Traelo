import { Link, useLocation } from 'react-router-dom'
import { getCartItemCount } from '../../features/cart'
import { useCartStore } from '../../store/cartStore'
import { Icon } from '../ui/Icon'
import { NAV_TABS, cartBadge, isTabActive } from './navigation'

/**
 * Barra de navegación flotante (pill) de la app móvil — `FloatingTabBar`: Categorías · Buscar ·
 * [Home elevado al centro] · Ayuda · Carrito. Solo en teléfono/tablet; en escritorio la
 * navegación vive en el header.
 */
export function FloatingTabBar() {
  const { pathname } = useLocation()
  const itemCount = useCartStore((state) => getCartItemCount(state.items))

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden fixed z-50 left-2 right-2 bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] mx-auto max-w-[560px] flex items-center justify-around rounded-full bg-surface px-1 py-2 shadow-float"
    >
      {NAV_TABS.map((tab) => {
        const active = isTabActive(tab, pathname)

        if (tab.to === '/') {
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`-mt-[30px] w-[60px] h-[60px] shrink-0 rounded-full border-4 border-background overflow-hidden flex items-center justify-center transition-shadow ${
                active
                  ? 'bg-gradient-primary text-white shadow-[0_4px_8px_0_rgb(var(--c-primary)/0.35)]'
                  : 'bg-surface-muted text-text-tertiary shadow-float'
              }`}
            >
              <Icon name="home" size={26} filled={active} />
            </Link>
          )
        }

        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className="flex-1 min-w-0 flex flex-col items-center gap-0.5"
          >
            <span className="relative" data-cart-target={tab.cart ? '' : undefined}>
              <Icon
                name={tab.icon}
                filled={active}
                className={active ? 'text-primary' : 'text-text-tertiary'}
              />
              {tab.cart && itemCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-[3px] rounded-full bg-primary text-white text-[10px] leading-3 font-semibold flex items-center justify-center">
                  {cartBadge(itemCount)}
                </span>
              )}
            </span>
            <span
              className={`self-stretch text-center text-[11px] leading-[14px] truncate ${
                active ? 'text-primary-text font-semibold' : 'text-text-tertiary'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
