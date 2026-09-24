import { useIsOnline } from '../../hooks/useIsOnline'

/** Aviso discreto de sin conexión (checklist §19 de mobile): nunca una pantalla de error gigante. */
export function OfflineBanner() {
  const online = useIsOnline()
  if (online) return null
  return (
    <div role="status" className="bg-warning px-3 py-1 text-center text-caption text-white">
      Sin conexión — mostrando información guardada
    </div>
  )
}
