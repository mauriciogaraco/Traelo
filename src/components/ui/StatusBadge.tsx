export type StatusTone = 'success' | 'warning' | 'danger' | 'primary' | 'info' | 'neutral'

const TONES: Record<StatusTone, { bg: string; dot: string; text: string }> = {
  success: { bg: 'bg-success/10', dot: 'bg-success', text: 'text-success-text' },
  warning: { bg: 'bg-warning/10', dot: 'bg-warning', text: 'text-warning-text' },
  danger: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger-text' },
  primary: { bg: 'bg-primary/10', dot: 'bg-primary', text: 'text-primary-text' },
  info: { bg: 'bg-info/10', dot: 'bg-info', text: 'text-info' },
  neutral: { bg: 'bg-surface-muted', dot: 'bg-text-tertiary', text: 'text-text-secondary' },
}

/**
 * Badge de estado (como `StatusBadge` de mobile): punto + texto, el color nunca es la única señal.
 * El texto usa el tono oscuro accesible de cada color.
 */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const t = TONES[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-label ${t.bg} ${t.text}`}>
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  )
}
