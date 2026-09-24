import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Barra fija abajo (acciones principales). */
  footer?: ReactNode
}

/**
 * Hoja modal: bottom sheet en teléfono (como las hojas de la app móvil) y diálogo centrado desde
 * sm. Cierra con Escape, con el fondo o con la X; bloquea el scroll de la página y devuelve el
 * foco a donde estaba al cerrarse.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-surface rounded-t-[24px] sm:rounded-r-lg shadow-2xl animate-slide-up sm:animate-scale-in focus:outline-none"
      >
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        <div className="flex items-center gap-3 px-5 pt-3 sm:pt-5 pb-3">
          <h2 id={titleId} className="flex-1 text-h3 text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-muted"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}
