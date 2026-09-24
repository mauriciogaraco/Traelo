import type { SVGProps } from 'react'

/**
 * Íconos de la interfaz: equivalentes web (SVG inline, sin librería) de los Ionicons que usa la app
 * móvil. Cada uno tiene versión de contorno y, cuando mobile la usa para el estado activo, rellena.
 */
export type IconName =
  | 'home'
  | 'grid'
  | 'search'
  | 'help'
  | 'cart'
  | 'person'
  | 'bell'
  | 'location'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'close'
  | 'wifi-off'
  | 'alert'
  | 'refresh'
  | 'heart'
  | 'star'
  | 'receipt'

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName
  size?: number
  /** Versión rellena (estado activo en la barra de navegación). */
  filled?: boolean
}

function paths(name: IconName, filled: boolean) {
  switch (name) {
    case 'home':
      return filled ? (
        <path fill="currentColor" stroke="none" d="M11.3 3.3a1 1 0 0 1 1.4 0l8 7.4a1 1 0 0 1-.7 1.7H19V20a1 1 0 0 1-1 1h-3.5v-5.5a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1V21H6a1 1 0 0 1-1-1v-7.6H4a1 1 0 0 1-.7-1.7l8-7.4Z" />
      ) : (
        <path d="M3.5 11.5 12 4l8.5 7.5M5.5 10v10h4.5v-5.5h4V20h4.5V10" />
      )
    case 'grid':
      return (
        <g fill={filled ? 'currentColor' : 'none'}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
        </g>
      )
    case 'search':
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" strokeWidth={filled ? 2.6 : undefined} />
          <path d="m15.5 15.5 5 5" strokeWidth={filled ? 2.6 : undefined} />
        </>
      )
    case 'help':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} />
          <path stroke={filled ? 'rgb(var(--c-surface))' : 'currentColor'} d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
          <circle cx="12" cy="17" r="0.6" fill={filled ? 'rgb(var(--c-surface))' : 'currentColor'} stroke="none" />
        </>
      )
    case 'cart':
      return (
        <>
          <path fill={filled ? 'currentColor' : 'none'} d="M3.5 4.5h2.2l2 11h10.1l2-8H6.7" />
          <circle cx="9" cy="19.5" r="1.4" fill="currentColor" />
          <circle cx="16.8" cy="19.5" r="1.4" fill="currentColor" />
        </>
      )
    case 'person':
      return (
        <>
          <circle cx="12" cy="8" r="4" fill={filled ? 'currentColor' : 'none'} />
          <path fill={filled ? 'currentColor' : 'none'} d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6Z" />
        </>
      )
    case 'bell':
      return (
        <>
          <path fill={filled ? 'currentColor' : 'none'} d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15Z" />
          <path d="M10 20.5a2 2 0 0 0 4 0" />
        </>
      )
    case 'location':
      return (
        <>
          <path fill={filled ? 'currentColor' : 'none'} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
          <circle cx="12" cy="10" r="2.3" fill={filled ? 'rgb(var(--c-surface))' : 'none'} stroke={filled ? 'none' : 'currentColor'} />
        </>
      )
    case 'chevron-down':
      return <path d="m6 9 6 6 6-6" />
    case 'chevron-right':
      return <path d="m9 6 6 6-6 6" />
    case 'chevron-left':
      return <path d="m15 6-6 6 6 6" />
    case 'close':
      return <path d="M6 6l12 12M18 6 6 18" />
    case 'wifi-off':
      return (
        <>
          <path d="M3 3l18 18M8.5 16.2a5 5 0 0 1 7 0M5 12.7a10 10 0 0 1 4-2.3M19 12.7a10 10 0 0 0-3.4-2.1M2 9.3a15 15 0 0 1 4.3-2.6M22 9.3a15 15 0 0 0-10-3.8c-.8 0-1.6.1-2.4.2" />
          <circle cx="12" cy="19.5" r="0.8" fill="currentColor" />
        </>
      )
    case 'alert':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5" />
          <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
        </>
      )
    case 'refresh':
      return <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
    case 'heart':
      return <path fill={filled ? 'currentColor' : 'none'} d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    case 'star':
      return <path fill={filled ? 'currentColor' : 'none'} d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7.9-5.6-4-3.9 5.6-.8Z" />
    case 'receipt':
      return <path fill={filled ? 'currentColor' : 'none'} d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3ZM9 8h6M9 11.5h6M9 15h4" />
  }
}

export function Icon({ name, size = 22, filled = false, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths(name, filled)}
    </svg>
  )
}
