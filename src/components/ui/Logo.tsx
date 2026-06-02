import logoUrl from '../../assets/logo.webp'

interface LogoProps {
  /** Tamaño de la marca (icono). */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar el texto "Tráelo" junto a la marca. */
  showWordmark?: boolean
  /** Usar un avión de papel (con estela) como acento sobre la "a", en vez de la tilde. */
  planeAccent?: boolean
  className?: string
}

const markSize = {
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-[14px]',
  lg: 'w-16 h-16 rounded-3xl',
}
const wordSize = {
  sm: 'text-2xl',
  md: 'text-[1.7rem]',
  lg: 'text-5xl',
}

/**
 * Acento en forma de avión de papel con puntos suspensivos detrás (estela de
 * vuelo). Va sobre la "a", inclinado, para que se lea como la tilde de "Tráelo".
 */
function PlaneAccent() {
  return (
    <span
      className="absolute left-1/2 -top-[0.46em] flex items-center gap-[0.05em] text-primary"
      style={{ transform: 'translateX(-46%) rotate(-16deg)' }}
      aria-hidden="true"
    >
      {/* puntos suspensivos / estela */}
      <span className="w-[0.07em] h-[0.07em] rounded-full bg-current opacity-40" />
      <span className="w-[0.1em] h-[0.1em] rounded-full bg-current opacity-60" />
      <span className="w-[0.13em] h-[0.13em] rounded-full bg-current opacity-80" />
      {/* avión de papel */}
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[0.5em] h-[0.5em] ml-[0.04em]">
        <path d="M21.7 3.3 2.5 11.1c-.9.4-.9 1.6 0 1.9l4.8 1.6 1.8 5.8c.2.7 1.1.9 1.6.3l2.7-2.9 4.7 3.4c.6.4 1.5.1 1.7-.6l3.4-15.6c.2-1-.8-1.9-1.5-1.7Z" />
      </svg>
    </span>
  )
}

export function Logo({
  size = 'md',
  showWordmark = true,
  planeAccent = true,
  className = '',
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src={logoUrl}
        alt="Tráelo"
        width={40}
        height={40}
        className={`${markSize[size]} object-cover shadow-btn-primary`}
        loading="eager"
        decoding="async"
      />
      {showWordmark && (
        <span className={`font-brand text-primary leading-none pb-1 ${wordSize[size]}`}>
          {planeAccent ? (
            <>
              Tr
              <span className="relative inline-block">
                a
                <PlaneAccent />
              </span>
              elo
            </>
          ) : (
            'Tráelo'
          )}
        </span>
      )}
    </span>
  )
}
