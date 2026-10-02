export function formatCup(value: number): string {
  return `${Math.round(value).toLocaleString('es')} CUP`
}

interface PriceProps {
  price: number | null
  effectivePrice?: number | null
  /** Apila el precio de oferta y el tachado, para espacios angostos (tarjetas). */
  compact?: boolean
  className?: string
}

/**
 * Precio normal y, si hay oferta activa, el tachado junto al de oferta — `Price` de mobile.
 * Nunca recalcula el descuento: solo muestra lo que manda el backend.
 */
export function Price({ price, effectivePrice, compact = false, className = '' }: PriceProps) {
  if (price == null) {
    return <span className={`text-caption text-text-tertiary ${className}`}>Precio no disponible</span>
  }
  const hasOffer = effectivePrice != null && effectivePrice !== price
  if (!hasOffer) {
    return <span className={`text-base font-bold text-text-primary ${className}`}>{formatCup(price)}</span>
  }
  return (
    <span className={`${compact ? 'flex flex-col' : 'inline-flex items-baseline gap-1'} min-w-0 ${className}`}>
      <span className="text-base font-bold text-primary-text truncate">{formatCup(effectivePrice)}</span>
      <s className={`text-text-tertiary truncate ${compact ? 'text-[11px] leading-[14px]' : 'text-caption'}`}>
        {formatCup(price)}
      </s>
    </span>
  )
}
