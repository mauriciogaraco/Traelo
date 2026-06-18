import type { Business } from '../../types'
import { LazyImage } from '../ui/LazyImage'
import { isOpenNow } from '../../lib/hours'

interface BusinessRailProps {
  businesses: Business[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/** Cuadrícula 2×2 de negocios, a todo el ancho, todas las tarjetas iguales. */
export function BusinessRail({ businesses, selectedId, onSelect }: BusinessRailProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {businesses.map((biz) => {
        const active = selectedId === biz.id
        const open = isOpenNow(biz)
        return (
          <button
            key={biz.id}
            onClick={() => onSelect(active ? null : biz.id)}
            className={`rounded-3xl border overflow-hidden text-left transition-all active:scale-[0.98] ${
              active
                ? 'border-primary ring-2 ring-primary/30 shadow-card'
                : 'border-border bg-surface hover:border-primary/30'
            }`}
          >
            <div className="relative">
              <LazyImage
                src={biz.image}
                alt={biz.name}
                className={`h-24 w-full ${open ? '' : 'grayscale-[35%] opacity-80'}`}
                placeholderClassName={biz.color}
              />
              <span
                className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur ${
                  open ? 'bg-green-50/90 text-success' : 'bg-stone-100/90 text-text-secondary'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-success' : 'bg-stone-400'}`} />
                {open ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
            <div className="p-2.5">
              <p className="text-sm font-bold text-text-primary leading-tight line-clamp-1">
                {biz.name}
              </p>
              <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                {biz.description}
              </p>
              {biz.schedule && (
                <p className="flex items-center gap-1 text-[10.5px] text-text-secondary mt-1.5 font-semibold">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                  </svg>
                  <span className="line-clamp-1">{biz.schedule.label}</span>
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
