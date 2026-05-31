import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { products } from '../data/catalog'
import { StockBadge } from '../components/ui/StockBadge'
import { ProductImage } from '../components/ui/ProductImage'
import { Button } from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { formatAmount } from '../lib/format'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)

  const product = products.find((p) => p.id === id)

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

  function add() {
    addItem(product!, qty)
  }

  return (
    <div className="animate-fade-in">
      {/* Imagen grande con botón volver */}
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
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-surface/90 backdrop-blur shadow-soft flex items-center justify-center text-text-primary"
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute top-4 right-4">
          <StockBadge status={product.stockStatus} size="md" />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {product.category}
          </span>
          <span className="text-xs font-semibold text-text-secondary">{product.businessName}</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary leading-tight mt-2">{product.name}</h1>

        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-3xl font-bold text-primary">{formatAmount(product.price)}</span>
          <span className="text-sm font-semibold text-text-secondary">CUP</span>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-bold text-text-primary mb-1.5">Descripción</h2>
          <p className="text-[15px] text-text-secondary leading-relaxed">{product.longDescription}</p>
        </div>

        {/* Cantidad */}
        {!isOut && (
          <div className="flex items-center justify-between mt-6 bg-surface border border-border rounded-2xl p-3">
            <span className="text-sm font-bold text-text-primary">Cantidad</span>
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

      {/* Espaciador para que el contenido no quede tras la barra de acción fija */}
      <div className="h-28" aria-hidden="true" />

      {/* Barra de acción fija */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40 bg-surface/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-4 pb-safe">
        {isOut ? (
          <Button size="lg" fullWidth disabled>
            Producto agotado
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="soft"
              size="lg"
              onClick={() => {
                add()
                navigate('/carrito')
              }}
            >
              Añadir
            </Button>
            <Button
              size="lg"
              onClick={() => {
                add()
                navigate('/checkout')
              }}
            >
              Comprar ahora
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
