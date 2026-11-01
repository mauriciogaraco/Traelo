export function formatCup(value: number): string {
  return `${Math.round(value).toLocaleString('es')} CUP`
}

export function formatUsd(value: number): string {
  return `${(Math.round(value * 100) / 100).toLocaleString('es', { maximumFractionDigits: 2 })} USD`
}

interface PriceProps {
  price: number | null
  effectivePrice?: number | null
  /** Producto definido en USD: se muestra siempre en USD (con `priceUsd`), nunca convertido a CUP. */
  priceCurrency?: 'CUP' | 'USD'
  priceUsd?: number | null
  /** Apila el precio de oferta y el tachado, para espacios angostos (tarjetas). */
  compact?: boolean
  className?: string
}

/**
 * Precio normal y, si hay oferta activa, el tachado junto al de oferta — `Price` de mobile.
 * Nunca recalcula el descuento: solo muestra lo que manda el backend. Los productos definidos en USD
 * se muestran en USD; el tachado se saca de la misma proporción que el backend aplicó en CUP.
 */
export function Price({ price, effectivePrice, priceCurrency, priceUsd, compact = false, className = '' }: PriceProps) {
  if (price == null) {
    return <span className={`text-caption text-text-tertiary ${className}`}>Precio no disponible</span>
  }
  const inUsd = priceCurrency === 'USD' && priceUsd != null
  const format = (cup: number) =>
    inUsd ? formatUsd(effectivePrice ? (priceUsd as number) * (cup / effectivePrice) : (priceUsd as number)) : formatCup(cup)
  const hasOffer = effectivePrice != null && effectivePrice !== price
  if (!hasOffer) {
    return <span className={`text-base font-bold text-text-primary ${className}`}>{format(price)}</span>
  }
  return (
    <span className={`${compact ? 'flex flex-col' : 'inline-flex items-baseline gap-1'} min-w-0 ${className}`}>
      <span className="text-base font-bold text-primary-text truncate">{format(effectivePrice)}</span>
      <s className={`text-text-tertiary truncate ${compact ? 'text-[11px] leading-[14px]' : 'text-caption'}`}>
        {format(price)}
      </s>
    </span>
  )
}
