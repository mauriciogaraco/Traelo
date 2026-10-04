import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { SWIPE_DISMISS_PX, shouldDismissSwipe } from '../../features/cart/floatingDismissal'

/**
 * Envuelve un aviso flotante para poder quitarlo: se desliza hacia un lado o se cierra con la X.
 * El deslizamiento solo mueve en horizontal (el scroll vertical de la página no se bloquea) y un
 * arrastre no cuenta como toque sobre el enlace de adentro.
 */
export function DismissibleBar({ children, onDismiss, closeLabel }: { children: ReactNode; onDismiss: () => void; closeLabel: string }) {
  const [dx, setDx] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const startX = useRef<number | null>(null)
  const moved = useRef(false)

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX
    moved.current = false
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return
    const delta = event.clientX - startX.current
    if (!moved.current && Math.abs(delta) < 8) return
    if (!moved.current) event.currentTarget.setPointerCapture(event.pointerId)
    moved.current = true
    setDx(delta)
  }

  function onPointerEnd() {
    if (startX.current === null) return
    startX.current = null
    if (shouldDismissSwipe(dx)) {
      setLeaving(true)
      setDx(dx > 0 ? 400 : -400)
      window.setTimeout(onDismiss, 180)
    } else {
      setDx(0)
    }
  }

  const dragging = startX.current !== null && moved.current
  const progress = Math.min(Math.abs(dx) / (SWIPE_DISMISS_PX * 3), 1)

  return (
    <div
      className="pointer-events-auto relative touch-pan-y"
      style={{
        transform: `translateX(${dx}px)`,
        opacity: leaving ? 0 : 1 - progress * 0.6,
        transition: dragging ? 'none' : 'transform 180ms ease-out, opacity 180ms ease-out',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(event) => {
        if (moved.current) {
          event.preventDefault()
          event.stopPropagation()
          moved.current = false
        }
      }}
    >
      {children}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onDismiss}
        className="absolute -top-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-soft hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}
