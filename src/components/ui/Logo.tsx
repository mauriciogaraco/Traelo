import logoUrl from '../../assets/logo.webp'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

const markSize = {
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-[14px]',
  lg: 'w-16 h-16 rounded-3xl',
}
const wordSize = {
  sm: 'text-xl',
  md: 'text-[1.4rem]',
  lg: 'text-4xl',
}
const subSize = {
  sm: 'text-[0.6rem]',
  md: 'text-[0.7rem]',
  lg: 'text-sm',
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src={logoUrl}
        alt="Tráelo Familia"
        width={40}
        height={40}
        className={`${markSize[size]} object-cover shadow-btn-primary`}
        loading="eager"
        decoding="async"
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={`font-brand text-primary pb-0.5 ${wordSize[size]}`}>
            Tráelo
          </span>
          <span className={`font-bold tracking-widest uppercase text-accent ${subSize[size]}`}>
            Familia
          </span>
        </span>
      )}
    </span>
  )
}
