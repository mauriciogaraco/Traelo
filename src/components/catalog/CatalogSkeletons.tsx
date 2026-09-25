import { Skeleton } from '../ui/Skeleton'

/** Esqueleto del Home (hero + carruseles) — `HomeSkeleton` de mobile. */
export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Cargando catálogo" className="px-4 pt-3 space-y-5">
      <Skeleton className="h-52 w-full rounded-[24px]" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="h-5 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-[152px] shrink-0 rounded-r-lg" />
        ))}
      </div>
    </div>
  )
}

/** Lista de negocios (Buscar → Negocios). */
export function BusinessListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando negocios" className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-r-lg bg-surface p-3 border border-border">
          <Skeleton className="w-16 h-16 rounded-r-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
