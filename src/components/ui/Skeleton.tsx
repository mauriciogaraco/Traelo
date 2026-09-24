import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

/**
 * Esqueletos (como `Skeleton` de mobile): bloques que pulsan con la forma de lo que va a aparecer,
 * en vez de una pantalla en blanco o una ruedita. `motion-safe` respeta "reducir movimiento".
 */
export function Skeleton({ className = 'h-4 w-full', style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`rounded-r-sm bg-surface-muted motion-safe:animate-pulse ${className}`}
    />
  )
}

/** Filas genéricas (listas: pedidos, puntos, direcciones). */
export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-r-lg bg-surface p-3 border border-border">
          <Skeleton className="h-12 w-12 rounded-r-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Grid de tarjetas de producto. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando productos" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-r-lg bg-surface border border-border overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
