import logomarkWhite from '../../assets/traelo-logomark-white.png'

interface LogoProps {
  /** Tamaño del isotipo: sm 36 · md 44 (el del header de la app) · lg 64. */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar el texto "Tráelo" junto al isotipo (header de escritorio). */
  showWordmark?: boolean
  className?: string
}

const badgeSize = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-16 h-16',
}
const markSize = {
  sm: 30,
  md: 38,
  lg: 54,
}

/**
 * Marca de Tráelo como en el `TopHeader` de la app móvil: isotipo blanco sobre el degradado
 * `hero` en un cuadrado redondeado con sombra naranja.
 */
export function Logo({ size = 'md', showWordmark = false, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span
        className={`${badgeSize[size]} rounded-r-lg bg-gradient-hero flex items-center justify-center shadow-[0_4px_8px_0_rgb(var(--c-primary)/0.3)] shrink-0`}
      >
        <img
          src={logomarkWhite}
          alt="Tráelo"
          width={markSize[size]}
          height={markSize[size]}
          className="object-contain"
          loading="eager"
          decoding="async"
        />
      </span>
      {showWordmark && (
        <span className="text-h2 font-extrabold text-text-primary tracking-tight">Tráelo</span>
      )}
    </span>
  )
}
