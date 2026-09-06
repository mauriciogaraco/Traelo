import { Link } from 'react-router-dom'
import type { Business } from '../../types'
import { businessCategories, businessCategoryEmoji } from '../../data/catalog'

interface BusinessCategoryGridProps {
  businesses: Business[]
}

/** Cuadrícula 2×2 de tarjetas de categoría de negocio (Destacados, Restaurantes, Pizzas, ...). */
export function BusinessCategoryGrid({ businesses }: BusinessCategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {businessCategories.map((cat) => {
        const count = businesses.filter((b) => b.businessCategories?.includes(cat)).length
        return (
          <Link
            key={cat}
            to={`/categorias?cat=${encodeURIComponent(cat)}`}
            className="rounded-3xl border border-border bg-surface overflow-hidden text-left transition-all active:scale-[0.98] hover:border-primary/30 shadow-soft"
          >
            <div className="flex flex-col items-center gap-2 py-6 px-3">
              <span className="w-14 h-14 rounded-2xl bg-gradient-primary text-white flex items-center justify-center text-2xl shadow-btn-primary">
                <span aria-hidden="true">{businessCategoryEmoji[cat]}</span>
              </span>
              <p className="text-sm font-bold text-text-primary text-center leading-tight">
                {cat}
              </p>
              <p className="text-[11px] text-text-secondary font-semibold">
                {count} {count === 1 ? 'negocio' : 'negocios'}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
