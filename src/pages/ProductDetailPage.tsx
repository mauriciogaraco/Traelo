import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { StockBadge } from '../components/ui/StockBadge'
import { ProductImage } from '../components/ui/ProductImage'
import { Button } from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/format'
import { hasAddons, hasFormato, hasOptions, hasPackaging, packSize } from '../lib/cart'
import type { Addon, Packaging } from '../types'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { products, loading } = useCatalog()
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [option, setOption] = useState<string | null>(null)
  const [addon, setAddon] = useState<Addon | null>(null)
  const [packaging, setPackaging] = useState<Packaging | null>(null)

  const product = products.find((p) => p.id === id)

  useEffect(() => {
    if (product?.packaging?.length === 1) setPackaging(product.packaging[0])
  }, [product])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-[2.5px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <span className="text-6xl mb-4">😕</span>
        <h2 className="text-lg font-bold text-text-primary mb-2">Producto no encontrado</h2>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    )
  }

  const isOut = product.stockStatus === 'agotado'
  const needsOption = hasOptions(product)
  const canAddon = hasAddons(product)
  const needsPackaging = hasPackaging(product)
  const multiPackaging = (product.packaging?.length ?? 0) > 1
  const canAdd =
    !isOut && (!needsOption || option !== null) && (!needsPackaging || packaging !== null)
  const unitPrice = product.price + (addon?.price ?? 0) + (packaging?.price ?? 0)

  function add() {
    if (!canAdd) return
    addItem(product!, qty, option ?? undefined, addon ?? undefined, packaging ?? undefined)
  }

  function goBack() {
    const idx = (window.history.state?.idx as number | undefined) ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="animate-fade-in">
      <div className="relative">
        <ProductImage
          emoji={product.image}
          photo={product.photo}
          category={product.category}
          alt={product.name}
          size="lg"
          eager
          className="w-full aspect-square rounded-b-4xl"
        />
        <button
          onClick={goBack}
          className="absolute top-4 left-4 z-10 h-10 pl-2.5 pr-3.5 rounded-full bg-surface/95 backdrop-blur border border-border shadow-card flex items-center gap-1.5 text-text-primary font-bold text-sm active:scale-95 transition-transform"
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="absolute top-4 right-4">
          <StockBadge status={product.stockStatus} size="md" />
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {product.category}
          </span>
          <span className="text-xs font-semibold text-text-secondary">{product.businessName}</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary leading-tight mt-2">{product.name}</h1>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-bold text-primary">{formatPrice(unitPrice)}</span>
          <span className="text-sm font-semibold text-text-secondary">USD</span>
          <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            Envío incluido
          </span>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-bold text-text-primary mb-1.5">Descripción</h2>
          <p className="text-[15px] text-text-secondary leading-relaxed">{product.longDescription}</p>
        </div>

        {needsOption && !isOut && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-bold text-text-primary">Elige el tipo</h2>
              {option === null && <span className="text-[11px] font-bold text-warning">Requerido</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.options!.map((opt) => {
                const active = option === opt
                return (
                  <button
                    key={opt}
                    onClick={() => setOption(opt)}
                    aria-pressed={active}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                      active
                        ? 'bg-gradient-primary text-white border-transparent shadow-btn-primary'
                        : 'bg-surface text-text-primary border-border hover:border-primary/40'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {canAddon && !isOut && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-bold text-text-primary">Agrega un extra</h2>
              <span className="text-[11px] font-bold text-text-secondary">Opcional · máx. 1</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.addons!.map((ag) => {
                const active = addon?.name === ag.name
                return (
                  <button
                    key={ag.name}
                    onClick={() => setAddon(active ? null : ag)}
                    aria-pressed={active}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                      active
                        ? 'bg-gradient-primary text-white border-transparent shadow-btn-primary'
                        : 'bg-surface text-text-primary border-border hover:border-primary/40'
                    }`}
                  >
                    {ag.name} <span className={active ? 'text-white/80' : 'text-text-secondary'}>+{formatPrice(ag.price)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {needsPackaging && !isOut && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-bold text-text-primary">Envase para llevar</h2>
              {multiPackaging
                ? packaging === null && <span className="text-[11px] font-bold text-warning">Requerido</span>
                : <span className="text-[11px] font-bold text-text-secondary">Obligatorio</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.packaging!.map((pk) => {
                const active = packaging?.name === pk.name
                return (
                  <button
                    key={pk.name}
                    onClick={() => multiPackaging && setPackaging(pk)}
                    aria-pressed={active}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                      multiPackaging ? 'active:scale-95' : 'cursor-default'
                    } ${
                      active
                        ? 'bg-gradient-primary text-white border-transparent shadow-btn-primary'
                        : 'bg-surface text-text-primary border-border hover:border-primary/40'
                    }`}
                  >
                    {pk.name} <span className={active ? 'text-white/80' : 'text-text-secondary'}>+{formatPrice(pk.price)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!isOut && (
          <div className="flex items-center justify-between mt-6 bg-surface border border-border rounded-2xl p-3">
            <div>
              <span className="text-sm font-bold text-text-primary">
                {hasFormato(product) ? 'Cajas' : 'Cantidad'}
              </span>
              {hasFormato(product) && (
                <span className="block text-[11px] font-semibold text-text-secondary">
                  = {qty * packSize(product)} unidades
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-primary active:scale-90 transition-transform"
                aria-label="Disminuir"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M5 12h14" />
                </svg>
              </button>
              <span className="w-6 text-center text-base font-bold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-xl bg-gradient-primary text-white flex items-center justify-center active:scale-90 transition-transform shadow-btn-primary"
                aria-label="Aumentar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-28" aria-hidden="true" />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40 bg-surface/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-4 pb-safe">
        {isOut ? (
          <Button size="lg" fullWidth disabled>Producto agotado</Button>
        ) : needsOption && option === null ? (
          <Button size="lg" fullWidth disabled>Elige un tipo para continuar</Button>
        ) : needsPackaging && packaging === null ? (
          <Button size="lg" fullWidth disabled>Elige el envase para continuar</Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="soft" size="lg" onClick={() => { add(); navigate('/carrito') }}>
              Añadir
            </Button>
            <Button size="lg" onClick={() => { add(); navigate('/checkout') }}>
              Comprar ahora
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
