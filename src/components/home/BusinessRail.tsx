import type { Business } from '../../types'
import { LazyImage } from '../ui/LazyImage'

interface BusinessRailProps {
  businesses: Business[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function BusinessRail({ businesses, selectedId, onSelect }: BusinessRailProps) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
      {businesses.map((biz) => {
        const active = selectedId === biz.id
        return (
          <button
            key={biz.id}
            onClick={() => onSelect(active ? null : biz.id)}
            className={`flex-shrink-0 w-36 rounded-3xl border overflow-hidden text-left transition-all active:scale-[0.98] ${
              active
                ? 'border-primary ring-2 ring-primary/30 shadow-card'
                : 'border-border bg-surface hover:border-primary/30'
            }`}
          >
            <LazyImage
              src={biz.image}
              alt={biz.name}
              className="h-20 w-full"
              placeholderClassName={biz.color}
            />
            <div className="p-2.5">
              <p className="text-sm font-bold text-text-primary leading-tight line-clamp-1">
                {biz.name}
              </p>
              <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                {biz.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
