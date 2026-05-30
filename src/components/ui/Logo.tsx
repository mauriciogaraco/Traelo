import logoUrl from '../../assets/logo.webp'

interface LogoProps {
  /** Tamaño de la marca (icono). */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar el texto "Tráelo" junto a la marca. */
  showWordmark?: boolean
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

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
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
        <span
          className={`font-brand text-primary leading-none pb-1 ${wordSize[size]}`}
        >
          Tráelo
        </span>
      )}
    </span>
  )
}
