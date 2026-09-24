import { Button } from './Button'
import { Icon } from './Icon'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

/** Estado de error genérico (checklist §37/§41 de mobile). Nunca mostrar el error crudo del backend. */
export function ErrorState({
  title = 'Algo salió mal',
  description = 'No pudimos completar esta acción. Inténtalo de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
      <span className="mb-1 w-[72px] h-[72px] rounded-full bg-danger-soft text-danger flex items-center justify-center">
        <Icon name="wifi-off" size={32} />
      </span>
      <h3 className="text-h3 text-text-primary">{title}</h3>
      <p className="text-caption text-text-secondary max-w-xs">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-3 w-full max-w-xs">
          Reintentar
        </Button>
      )}
    </div>
  )
}
