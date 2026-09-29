import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import {
  MAX_RATING,
  MIN_RATING,
  RATING_STEP,
  STAR_COUNT,
  clampRating,
  formatRating,
  positionToRating,
  ratingToStarFills,
} from '../../features/orders/rating'

const STAR_PATH = 'M12 2.5l2.95 6.2 6.8.9-5 4.7 1.3 6.7L12 17.7l-6 3.3 1.3-6.7-5-4.7 6.8-.9L12 2.5Z'

/**
 * Estrellas de 1.0 a 5.0 con un decimal (paso 0.1), como `StarRating` de mobile: se toca o se arrastra
 * sobre las estrellas y cada una se rellena en proporción (4.7 → cuatro llenas y una al 70 %).
 * Accesible como un control deslizante: flechas ±0.1, Re Pág/Av Pág ±0.5, Inicio/Fin = 1.0/5.0.
 */
export function StarRating({
  value,
  onChange,
  label,
}: {
  value: number | null
  onChange: (rating: number) => void
  label: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const fills = ratingToStarFills(value)

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    onChange(positionToRating(event.clientX - rect.left, rect.width))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = value ?? MIN_RATING
    const next: Record<string, number> = {
      ArrowRight: current + RATING_STEP,
      ArrowUp: current + RATING_STEP,
      ArrowLeft: current - RATING_STEP,
      ArrowDown: current - RATING_STEP,
      PageUp: current + 0.5,
      PageDown: current - 0.5,
      Home: MIN_RATING,
      End: MAX_RATING,
    }
    if (event.key in next) {
      event.preventDefault()
      onChange(clampRating(next[event.key] as number))
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={MIN_RATING}
        aria-valuemax={MAX_RATING}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? 'Sin valorar' : formatRating(value)}
        onPointerDown={(event) => {
          dragging.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          fromPointer(event)
        }}
        onPointerMove={(event) => dragging.current && fromPointer(event)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={onKeyDown}
        className="flex touch-none select-none cursor-pointer rounded-r-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => (
          <svg key={index} width="36" height="36" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <defs>
              <clipPath id={`star-fill-${label}-${index}`}>
                <rect x="0" y="0" width={24 * (fills[index] ?? 0)} height="24" />
              </clipPath>
            </defs>
            <path d={STAR_PATH} fill="none" stroke="rgb(var(--c-text-disabled))" strokeWidth="1.6" strokeLinejoin="round" />
            <path d={STAR_PATH} fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.6" strokeLinejoin="round" clipPath={`url(#star-fill-${label}-${index})`} />
          </svg>
        ))}
      </div>
      <span className="min-w-[4.5rem] text-caption font-semibold tabular-nums text-text-secondary" aria-hidden="true">
        {value === null ? 'Toca las estrellas' : formatRating(value)}
      </span>
    </div>
  )
}
