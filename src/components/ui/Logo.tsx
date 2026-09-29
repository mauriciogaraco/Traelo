import logomarkWhite from '../../assets/traelo-logomark-white.png'

interface LogoProps {
  /** Tamaño del isotipo: sm 36 · md 44 (el del header de la app) · lg 64. */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar el texto "Tráelo" junto al isotipo (header de escritorio). */
  showWordmark?: boolean
  className?: string
}

const badgeSize = {
  sm: 'w-[33px] h-[33px]',
  md: 'w-[41px] h-[41px]',
  lg: 'w-[60px] h-[60px]',
}
const markSize = {
  sm: 31,
  md: 39,
  lg: 56,
}

/**
 * Marca de Tráelo como en el `TopHeader` de la app móvil: isotipo blanco sobre el degradado
 * `hero` en un cuadrado redondeado con sombra naranja.
 */
export function Logo({ size = 'md', showWordmark = false, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span
        // `rounded-[16px]` a propósito, no `rounded-r-lg`: ese nombre choca con la utilidad nativa
        // de Tailwind "redondear solo el lado derecho" y dejaba las esquinas izquierda/derecha con
        // radios distintos (16px vs 8px) — por eso se veía chueco.
        className={`${badgeSize[size]} rounded-[16px] bg-gradient-hero flex items-center justify-center shadow-[0_4px_8px_0_rgb(var(--c-primary)/0.3)] shrink-0`}
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
