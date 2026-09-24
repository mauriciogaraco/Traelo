import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Como `Button` de mobile: `primary` (degradado de marca), `outline` (borde naranja) y
   * `soft` (= "secondary" en mobile, fondo naranja suave). `ghost`/`danger` son extras de la web.
   */
  variant?: 'primary' | 'outline' | 'soft' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  /** Muestra un indicador y bloquea el botón mientras dura una petición. */
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary:
    'bg-gradient-primary text-white shadow-[0_4px_8px_0_rgb(var(--c-primary)/0.25)] hover:brightness-105 active:opacity-90',
  outline: 'bg-transparent border border-primary text-primary-text hover:bg-primary/5 active:bg-primary/10',
  soft: 'bg-primary-soft text-primary-text hover:brightness-95 active:brightness-90',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:brightness-110 active:opacity-90',
}

// La altura mínima de 48 px (md/lg) es la de mobile: objetivo táctil cómodo.
const sizes = {
  sm: 'min-h-9 px-4 text-sm',
  md: 'min-h-12 px-4 text-[15px]',
  lg: 'min-h-12 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-r-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-4 h-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
        />
      )}
      {children}
    </button>
  )
}
