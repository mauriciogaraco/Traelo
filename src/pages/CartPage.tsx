import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BusinessStatusBadge } from '../components/catalog/BusinessStatusBadge'
import { CatalogImage } from '../components/catalog/CatalogImage'
import { formatCup } from '../components/catalog/Price'
import { RedemptionSection } from '../components/rewards/RedemptionSection'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { QuantitySelector } from '../components/ui/QuantitySelector'
import { useToast } from '../context/ToastContext'
import { estimateCartLine, getCartSubtotalEstimate, groupCartByBusiness, lineIdOf, packSizeOf } from '../features/cart'
import { visualForProduct } from '../features/catalog'
import { validApplied } from '../features/rewards'
import { isRemovableIssue, precheckCart, removeUnavailableFromCart } from '../services/checkoutService'
import { MAX_LINE_QUANTITY, useCartStore } from '../store/cartStore'
import { useCatalogStore } from '../store/catalogStore'
import { useRewardsStore } from '../store/rewardsStore'
import type { CartChangeDetail } from '../types/backend/order'

function findProductIssue(issues: CartChangeDetail[], productId: string) {
  return issues.find((issue) => issue.type === 'product' && issue.productId === productId)
}

function findBusinessIssue(issues: CartChangeDetail[], businessId: string) {
  return issues.find((issue) => issue.type === 'business' && issue.businessId === businessId)
}

/**
 * Carrito — `CartScreen` de mobile: agrupado por negocio, lo elegido en cada línea (tipo, agrego,
 * envase), estimados (el total real lo calcula el servidor) y, antes del formulario de entrega, una
 * revisión con el servidor para marcar aquí lo agotado o cerrado, y el canje de puntos (con cuenta).
 */
export function CartPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const items = useCartStore((state) => state.items)
  const checkoutIssues = useCartStore((state) => state.checkoutIssues)
  const incrementItem = useCartStore((state) => state.incrementItem)
  const decrementItem = useCartStore((state) => state.decrementItem)
  const removeBusinessItems = useCartStore((state) => state.removeBusinessItems)
  const businesses = useCatalogStore((state) => state.businesses)
  const catalogProducts = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const productById = useMemo(() => new Map(catalogProducts.map((p) => [p.id, p])), [catalogProducts])
  const groups = useMemo(() => groupCartByBusiness(items, businesses), [items, businesses])
  const subtotalEstimate = useMemo(() => getCartSubtotalEstimate(items), [items])
  const [checking, setChecking] = useState(false)
  const appliedRedemption = useRewardsStore((state) => state.applied)
  const applied = useMemo(() => validApplied(appliedRedemption, items), [appliedRedemption, items])

  const handleContinue = async () => {
    if (checking) return
    setChecking(true)
    const result = await precheckCart(
      items,
      applied ? { rewardId: applied.reward.id, expectedBalance: applied.expectedBalance } : undefined,
    )
    setChecking(false)
    if (result.ok) {
      navigate('/checkout')
      return
    }
    if (result.message) {
      showToast(`Ya no tomamos pedidos hoy. ${result.message}`, 'error')
      return
    }
    showToast(
      result.issues.length === 1
        ? `Tu carrito cambió: ${result.issues[0]!.message}`
        : 'Tu carrito cambió: hay productos o locales que ya no se pueden pedir. Los marcamos abajo.',
      'error',
    )
  }

  const handleRemoveUnavailable = () => {
    const removed = removeUnavailableFromCart(checkoutIssues)
    showToast(`${removed === 1 ? 'Quitamos 1 producto' : `Quitamos ${removed} productos`}. Ya puedes continuar con lo demás.`, 'info')
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="cart"
        title="Tu carrito está vacío"
        description="Agrega productos desde el catálogo para empezar."
        action={
          <Link to="/" className="inline-flex min-h-12 items-center rounded-r-md bg-gradient-primary px-5 font-semibold text-white">
            Ver el catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="px-4 lg:px-6 pt-3 lg:pt-6 pb-44 lg:pb-10">
      <h1 className="text-h1 text-text-primary mb-4">Tu carrito</h1>

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start">
        <div className="space-y-4">
          {checkoutIssues.length > 0 && (
            <div role="alert" className="rounded-r-md bg-warning/10 p-3 space-y-2">
              <p className="flex items-center gap-2 font-semibold text-warning-text">
                <Icon name="alert" size={20} />
                Tu carrito cambió
              </p>
              <p className="text-caption text-text-secondary">
                Marcamos abajo qué producto o negocio cambió — quítalo o ajústalo para poder continuar.
              </p>
              {checkoutIssues.some(isRemovableIssue) && (
                <Button variant="outline" size="sm" onClick={handleRemoveUnavailable}>
                  Quitar lo que no está disponible
                </Button>
              )}
            </div>
          )}

          {groups.map((group) => {
            const businessIssue = findBusinessIssue(checkoutIssues, group.businessId)
            const name = group.business?.name ?? 'Negocio'
            return (
              <section key={group.businessId} className="rounded-r-lg bg-surface border border-border/60 shadow-card">
                <header className="flex items-center gap-3 p-3 border-b border-border">
                  <CatalogImage uri={group.business?.logoUrl} width={40} label={name} className="w-10 h-10 shrink-0 rounded-[10px]" />
                  <h2 className="flex-1 min-w-0 text-h3 text-text-primary truncate">{name}</h2>
                  {group.business && <BusinessStatusBadge business={group.business} />}
                </header>

                {businessIssue && (
                  <div className="m-3 rounded-r-md bg-danger-soft p-3 space-y-2">
                    <p className="flex items-start gap-1.5 text-caption text-danger-text">
                      <Icon name="alert" size={16} className="mt-px shrink-0" />
                      {businessIssue.message}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => removeBusinessItems(group.businessId)}>
                      Quitar estos productos
                    </Button>
                  </div>
                )}

                <ul className="divide-y divide-border">
                  {group.items.map((item) => {
                    const issue = findProductIssue(checkoutIssues, item.productId)
                    const lineId = lineIdOf(item)
                    const packSize = packSizeOf(item.formatoSnapshot)
                    return (
                      <li key={lineId} className="flex gap-3 p-3">
                        <Link to={`/producto/${item.productId}`} className="shrink-0">
                          <CatalogImage
                            uri={item.imageUrlSnapshot}
                            width={64}
                            visual={visualForProduct(productById.get(item.productId) ?? { categoryId: null }, categories)}
                            className="w-16 h-16 rounded-r-md"
                          />
                        </Link>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-[15px] font-semibold text-text-primary line-clamp-2">{item.nameSnapshot}</p>
                          <p className="text-caption text-text-secondary">
                            {item.priceSnapshot != null
                              ? `${formatCup(item.priceSnapshot)}${packSize > 1 ? ` por caja de ${packSize}` : ''}`
                              : 'Precio no disponible'}
                          </p>
                          {item.optionName && <p className="text-caption text-text-secondary">Tipo: {item.optionName}</p>}
                          {item.addonName && (
                            <p className="text-caption text-text-secondary">
                              Agrego: {item.addonName}
                              {item.addonPriceSnapshot ? ` (+${formatCup(item.addonPriceSnapshot)}${packSize > 1 ? ' c/u' : ''})` : ''}
                            </p>
                          )}
                          {item.packagingName && (
                            <p className="text-caption text-text-secondary">
                              Envase: {item.packagingName}
                              {item.packagingPriceSnapshot ? ` (+${formatCup(item.packagingPriceSnapshot)})` : ''}
                            </p>
                          )}
                          {item.priceSnapshot != null && (
                            <p className="text-caption font-semibold text-text-primary">Total línea: {formatCup(estimateCartLine(item))}</p>
                          )}
                          {issue && <p className="text-caption font-semibold text-danger-text">{issue.message}</p>}
                        </div>
                        <div className="self-center">
                          <QuantitySelector
                            quantity={item.quantity}
                            max={MAX_LINE_QUANTITY}
                            removeAtOne
                            label={`Cantidad de ${item.nameSnapshot}`}
                            onIncrement={() => incrementItem(lineId)}
                            onDecrement={() => decrementItem(lineId)}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}

          <RedemptionSection items={items} />
        </div>

        {/* Resumen: fijo abajo en teléfono (como mobile), columna lateral en escritorio. */}
        <aside className="fixed lg:sticky inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] lg:bottom-auto lg:top-24 z-30 mx-2 lg:mx-0 rounded-r-lg bg-surface border border-border shadow-float lg:shadow-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-body text-text-primary">Subtotal estimado</span>
            <span className="text-h3 text-text-primary">{formatCup(subtotalEstimate)}</span>
          </div>
          <p className="text-caption text-text-secondary">El delivery y el total final se calculan al confirmar.</p>
          <Button fullWidth loading={checking} onClick={handleContinue}>
            Continuar
          </Button>
        </aside>
      </div>
    </div>
  )
}
