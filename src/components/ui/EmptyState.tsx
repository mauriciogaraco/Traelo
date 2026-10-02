import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  /** Ícono de la interfaz o, por compatibilidad con las pantallas viejas, un emoji. */
  icon?: IconName | string
  title: string
  description?: string
  action?: ReactNode
}

const ICON_NAMES = new Set<string>([
  'home', 'grid', 'search', 'help', 'cart', 'person', 'bell', 'location', 'heart', 'star', 'receipt', 'alert',
])

/** Estado vacío (checklist §42 de mobile): círculo naranja suave + título + descripción. */
export function EmptyState({ icon = 'search', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
      <span className="mb-1 w-[72px] h-[72px] rounded-full bg-primary-soft text-primary flex items-center justify-center">
        {ICON_NAMES.has(icon) ? (
          <Icon name={icon as IconName} size={32} />
        ) : (
          <span className="text-[32px] leading-none">{icon}</span>
        )}
      </span>
      <h3 className="text-h3 text-text-primary">{title}</h3>
      {description && <p className="text-caption text-text-secondary max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
