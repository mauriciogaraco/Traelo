import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CatalogImage } from '../components/catalog/CatalogImage'
import { formatCup, Price } from '../components/catalog/Price'
import { Button } from '../components/ui/Button'
import { ChipRow } from '../components/ui/ChipRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { QuantitySelector } from '../components/ui/QuantitySelector'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../context/ToastContext'
import { cheapestPackaging, estimateLine, findAddon, findPackaging, packSizeOf, requiresOption } from '../features/cart'
import { getBusinessStatus, isSoldOut, visualForProduct } from '../features/catalog'
import { flyToCart } from '../lib/flyToCart'
import { optimizedImageUrl } from '../lib/images'
import { MAX_LINE_QUANTITY, useCartStore } from '../store/cartStore'
import { useCatalogStore } from '../store/catalogStore'

/**
 * Ficha de producto — `ProductScreen` de mobile. Reglas del carrito: el tipo/sabor es OBLIGATORIO si
 * el producto tiene; el agrego es opcional (uno); el envase viene preseleccionado (el más barato) y se
 * puede cambiar. El total mostrado es un estimado: el real lo calcula el servidor al confirmar.
 * Pendiente (fase 5): favorito y aviso de recompensa, que en mobile dependen de la sesión.
 */
export function ProductDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const product = useCatalogStore((state) => state.products.find((p) => p.id === id))
  const businesses = useCatalogStore((state) => state.businesses)
  const categories = useCatalogStore((state) => state.categories)
  const addItem = useCartStore((state) => state.addItem)

  const [quantity, setQuantity] = useState(1)
  const [optionName, setOptionName] = useState<string | null>(null)
  const [addonName, setAddonName] = useState<string | null>(null)
  const [packagingChoice, setPackagingChoice] = useState<string | null>(null)
  const [imageOpen, setImageOpen] = useState(false)

  // Otro producto (p. ej. al navegar entre fichas): se empieza de cero.
  useEffect(() => {
    setQuantity(1)
    setOptionName(null)
    setAddonName(null)
    setPackagingChoice(null)
  }, [id])

  const business = useMemo(() => businesses.find((b) => b.id === product?.businessId), [businesses, product])

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  if (!product) {
    return (
      <>
        <BackButton onClick={goBack} />
        <EmptyState icon="search" title="Producto no encontrado" description="Puede que ya no esté disponible." />
      </>
    )
  }

  const soldOut = isSoldOut(product)
  const businessStatus = business ? getBusinessStatus(business) : null
  const packagingOptions = product.packaging ?? []
  const addonOptions = product.addons ?? []
  const optionList = product.options ?? []
  const needsOption = requiresOption(product)
  const packagingName = packagingChoice ?? cheapestPackaging(product)?.name ?? null
  const packSize = packSizeOf(product.formato)
  const canAdd = !needsOption || optionName !== null
  const packaging = findPackaging(product, packagingName)
  const estimate = estimateLine({
    price: product.effectivePrice ?? product.price,
    quantity,
    formato: product.formato,
    addonPrice: findAddon(product, addonName)?.price,
    packagingPrice: packaging?.price,
    packagingCapacity: packaging?.capacity,
  })

  const handleAdd = (origin: HTMLElement) => {
    if (!canAdd) {
      showToast('Elige el tipo: este producto tiene varios tipos o sabores.', 'info')
      return
    }
    addItem(product, quantity, { optionName, addonName, packagingName })
    flyToCart(origin)
    showToast(`Agregado al carrito: ${quantity} × ${product.name}`, 'success')
    setQuantity(1)
    setOptionName(null)
    setAddonName(null)
    setPackagingChoice(null)
  }

  const visual = visualForProduct(product, categories)

  return (
    <div className="pb-28 lg:pb-10 lg:px-6 lg:pt-6">
      <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
        <div className="relative lg:sticky lg:top-24">
          <BackButton onClick={goBack} />
          {product.imageUrl ? (
            <button
              type="button"
              onClick={() => setImageOpen(true)}
              aria-label={`Ver imagen de ${product.name} en grande`}
              className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <CatalogImage uri={product.imageUrl} width={640} visual={visual} alt={product.name} eager className="w-full aspect-square lg:rounded-r-lg" />
            </button>
          ) : (
            <CatalogImage uri={null} width={640} visual={visual} className="w-full aspect-[4/3] lg:aspect-square lg:rounded-r-lg" />
          )}
        </div>

        <div className="px-4 lg:px-0 pt-4 lg:pt-0 space-y-3">
          <div className="space-y-1">
            <h1 className="text-h1 text-text-primary">{product.name}</h1>
            {business && (
              <Link to={`/negocio/${business.id}`} className="inline-block text-[15px] font-semibold text-primary-text hover:underline">
                {business.name}
              </Link>
            )}
          </div>
          <Price price={product.price} effectivePrice={product.effectivePrice} className="text-lg" />
          {soldOut ? (
            <div>
              <StatusBadge label="Agotado" tone="danger" />
            </div>
          ) : product.lowStock ? (
            <div>
              <StatusBadge label="Pocas unidades" tone="warning" />
            </div>
          ) : null}
          {product.description && <p className="text-body text-text-secondary whitespace-pre-line">{product.description}</p>}
          {packSize > 1 && (
            <p className="text-caption text-text-secondary">Se vende por caja de {packSize} unidades — la cantidad cuenta cajas.</p>
          )}

          {!soldOut && optionList.length > 0 && (
            <section className="space-y-1.5">
              <h2 className="text-[15px] font-semibold text-text-primary">Tipo / sabor (obligatorio)</h2>
              <ChipRow
                label="Tipo o sabor"
                items={optionList.map((name) => ({ key: name, label: name, selected: optionName === name }))}
                onPress={(key) => setOptionName(key)}
              />
            </section>
          )}

          {!soldOut && addonOptions.length > 0 && (
            <section className="space-y-1.5">
              <h2 className="text-[15px] font-semibold text-text-primary">Agrego (opcional)</h2>
              <ChipRow
                label="Agrego"
                items={[
                  { key: '__none__', label: 'Sin agrego', selected: addonName === null },
                  ...addonOptions.map((addon) => ({
                    key: addon.name,
                    label: `${addon.name} (+${formatCup(addon.price)}${packSize > 1 ? ' c/u' : ''})`,
                    selected: addonName === addon.name,
                  })),
                ]}
                onPress={(key) => setAddonName(key === '__none__' ? null : key)}
              />
            </section>
          )}

          {!soldOut && packagingOptions.length > 1 && (
            <section className="space-y-1.5">
              <h2 className="text-[15px] font-semibold text-text-primary">Envase</h2>
              <ChipRow
                label="Envase"
                items={packagingOptions.map((option) => ({
                  key: option.name,
                  label: `${option.name} (+${formatCup(option.price)})`,
                  selected: packagingName === option.name,
                }))}
                onPress={(key) => setPackagingChoice(key)}
              />
            </section>
          )}
          {!soldOut && packagingOptions.length === 1 && (
            <p className="text-caption text-text-secondary">
              Envase: {packagingOptions[0]!.name} (+{formatCup(packagingOptions[0]!.price)})
            </p>
          )}

          {!soldOut && (
            <div className="flex items-center justify-between rounded-r-md bg-surface border border-border px-3 py-2.5">
              <span className="text-body text-text-primary">Total estimado</span>
              <span className="text-h3 text-text-primary">{formatCup(estimate)}</span>
            </div>
          )}

          {businessStatus && businessStatus.label !== 'ABIERTO' && (
            <p className="text-caption text-warning-text">
              {business?.name} está {businessStatus.label.toLowerCase()} ahora mismo — igual puedes agregarlo, el pedido se
              valida al confirmar.
            </p>
          )}

          {/* Barra de acción: fija abajo en teléfono (como mobile), en línea en escritorio. */}
          <div className="fixed lg:static inset-x-0 bottom-0 z-40 bg-surface/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-t lg:border-0 border-border px-4 lg:px-0 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:pt-2">
            <div className="mx-auto max-w-content lg:max-w-none flex items-center gap-3">
              {!soldOut && (
                <QuantitySelector
                  quantity={quantity}
                  max={MAX_LINE_QUANTITY}
                  onIncrement={() => setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))}
                  onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                />
              )}
              {soldOut ? (
                <Button fullWidth disabled>
                  Agotado
                </Button>
              ) : (
                <Button fullWidth disabled={!canAdd} onClick={(e) => handleAdd(e.currentTarget)}>
                  {canAdd ? 'Agregar al carrito' : 'Elige el tipo'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {imageOpen && product.imageUrl && (
        <ImageViewer src={optimizedImageUrl(product.imageUrl, 1200) ?? product.imageUrl} title={product.name} onClose={() => setImageOpen(false)} />
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute lg:hidden top-[max(12px,env(safe-area-inset-top))] left-3 z-10 inline-flex items-center gap-1 rounded-full bg-surface/90 backdrop-blur px-3 py-2 text-sm font-semibold text-text-primary shadow-soft"
    >
      <Icon name="chevron-left" size={18} />
      Volver
    </button>
  )
}

/** Foto en grande — `ImageViewer` de mobile. Cierra con la X, Escape o tocando el fondo. */
function ImageViewer({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <img src={src} alt={title} className="max-w-full max-h-full object-contain rounded-r-md" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
      >
        <Icon name="close" size={22} />
      </button>
    </div>
  )
}
