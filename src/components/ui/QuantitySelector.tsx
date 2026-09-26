interface QuantitySelectorProps {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  /** Límite de la regla del carrito (el servidor también la exige). */
  max?: number
  /** En el carrito, bajar de 1 quita la línea: el botón "−" se muestra como papelera. */
  removeAtOne?: boolean
  label?: string
}

/** − cantidad + — `QuantitySelector` de mobile, con botones de 36 px. */
export function QuantitySelector({ quantity, onIncrement, onDecrement, max = 99, removeAtOne = false, label = 'Cantidad' }: QuantitySelectorProps) {
  const removing = removeAtOne && quantity <= 1
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1 rounded-full bg-surface-muted p-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={!removeAtOne && quantity <= 1}
        aria-label={removing ? 'Quitar del carrito' : 'Quitar uno'}
        className={`w-9 h-9 rounded-full bg-surface flex items-center justify-center shadow-soft disabled:opacity-40 disabled:shadow-none transition ${
          removing ? 'text-danger' : 'text-text-primary'
        }`}
      >
        {removing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        )}
      </button>
      <span className="min-w-8 text-center text-base font-bold text-text-primary tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= max}
        aria-label="Agregar uno"
        className="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center disabled:opacity-40 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
