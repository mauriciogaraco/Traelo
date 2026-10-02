export interface ChipItem {
  key: string
  label: string
  selected?: boolean
}

interface ChipRowProps {
  items: ChipItem[]
  onPress: (key: string) => void
  /** Nombre del grupo para lectores de pantalla (p.ej. "Ordenar por"). */
  label: string
}

/**
 * Fila de chips seleccionables (orden, filtros, empaques) — `ChipRow` de mobile. En teléfono se
 * desplaza horizontalmente; desde sm se reparte en varias líneas.
 */
export function ChipRow({ items, onPress, label }: ChipRowProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-2 overflow-x-auto scrollbar-none py-0.5 sm:flex-wrap sm:overflow-visible"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={item.selected ?? false}
          onClick={() => onPress(item.key)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
            item.selected
              ? 'bg-primary border-primary text-white'
              : 'bg-surface border-border text-text-primary hover:border-primary/40'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
