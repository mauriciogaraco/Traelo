export interface SegmentedOption<K extends string> {
  key: K
  label: string
  /** Cantidad de resultados de esa pestaña (se muestra como insignia). */
  count?: number
}

interface SegmentedTabsProps<K extends string> {
  options: SegmentedOption<K>[]
  value: K
  onChange: (key: K) => void
  label: string
}

/**
 * Pestañas tipo píldora (Productos | Negocios) — `SegmentedTabs` de mobile: el indicador se
 * desliza hasta la elegida (sin animación con "reducir movimiento").
 */
export function SegmentedTabs<K extends string>({ options, value, onChange, label }: SegmentedTabsProps<K>) {
  const index = Math.max(0, options.findIndex((option) => option.key === value))
  return (
    <div role="tablist" aria-label={label} className="relative flex rounded-full bg-surface-muted p-1">
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-full bg-surface shadow-soft motion-safe:transition-transform motion-safe:duration-300"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => {
        const selected = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.key)}
            className={`relative z-[1] flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${
              selected ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] leading-5 ${
                  selected ? 'bg-primary text-white' : 'bg-border text-text-secondary'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
