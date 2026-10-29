import { isHalloweenActive } from './halloween'
import { WitchHat } from './HalloweenArt'

/** Sombrerito de bruja posado sobre la esquina del logo (el isotipo no se modifica). Va dentro de un padre `relative`. */
export function HalloweenLogoAccent({ className = '' }: { className?: string }) {
  if (!isHalloweenActive()) return null
  return <WitchHat className={`pointer-events-none absolute -right-1.5 -top-1 h-[16px] w-[18px] rotate-[14deg] ${className}`} />
}
