import { useState } from 'react'
import { isAnalyticsOptedOut, setAnalyticsOptOut } from '../../analytics'

/**
 * Interruptor del registro de uso en ESTE navegador (ver la sección 2.7 de la política de privacidad).
 * Desactivarlo descarta lo que estaba pendiente y olvida el identificador anónimo.
 */
export function AnalyticsOptOut() {
  const [optedOut, setOptedOut] = useState(() => isAnalyticsOptedOut())

  function toggle() {
    const next = !optedOut
    setAnalyticsOptOut(next)
    setOptedOut(next)
  }

  return (
    <div className="rounded-r-lg border border-border bg-surface p-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-text-primary">Registro de uso en este navegador</p>
        <p className="text-caption text-text-secondary">
          {optedOut ? 'Desactivado: no registramos lo que haces aquí.' : 'Activado: nos ayuda a mejorar Tráelo.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!optedOut}
        aria-label="Registro de uso en este navegador"
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
          optedOut ? 'bg-surface-muted border border-border' : 'bg-primary'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${optedOut ? 'left-0.5' : 'left-[22px]'}`}
        />
      </button>
    </div>
  )
}
