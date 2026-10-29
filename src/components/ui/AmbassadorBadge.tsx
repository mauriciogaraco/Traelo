import type { AmbassadorTier } from '../../types/backend/referral'

/**
 * Insignia del perfil: medallita de oro (embajador) o de diamante (embajador especial). Son SVG propios — no
 * dependen de emojis, que se ven distinto en cada dispositivo — y llevan texto para lectores de pantalla.
 */
export function AmbassadorBadge({ tier }: { tier: AmbassadorTier }) {
  const special = tier === 'SPECIAL'
  const label = special ? 'Embajador especial' : 'Embajador'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-caption font-semibold shadow-sm ${
        special ? 'bg-white text-cyan-800' : 'bg-white text-amber-800'
      }`}
    >
      {special ? <DiamondMedal /> : <GoldMedal />}
      {label}
    </span>
  )
}

function GoldMedal() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <defs>
        <linearGradient id="amb-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE27A" />
          <stop offset="0.55" stopColor="#F5B301" />
          <stop offset="1" stopColor="#C98700" />
        </linearGradient>
      </defs>
      <path d="M7 2h4l1 5-3 1.5L7 2z" fill="#E5484D" />
      <path d="M17 2h-4l-1 5 3 1.5L17 2z" fill="#B42318" />
      <circle cx="12" cy="15" r="7" fill="url(#amb-gold)" stroke="#B97A00" strokeWidth="0.8" />
      <circle cx="12" cy="15" r="4.6" fill="none" stroke="#FFF3C4" strokeWidth="0.9" opacity="0.9" />
      <path d="M12 11.6l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3 1-2.1z" fill="#FFF8DC" />
    </svg>
  )
}

function DiamondMedal() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <defs>
        <linearGradient id="amb-diamond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E0FBFF" />
          <stop offset="0.5" stopColor="#5CD6F2" />
          <stop offset="1" stopColor="#1693C2" />
        </linearGradient>
      </defs>
      <path d="M7 2h4l1 5-3 1.5L7 2z" fill="#6D5BD0" />
      <path d="M17 2h-4l-1 5 3 1.5L17 2z" fill="#4B3AA8" />
      <circle cx="12" cy="15" r="7" fill="#EAF9FF" stroke="#7CCBE3" strokeWidth="0.8" />
      <path d="M8.2 13.2L10 11h4l1.8 2.2L12 19.2 8.2 13.2z" fill="url(#amb-diamond)" stroke="#1693C2" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M8.2 13.2h7.6M10 11l2 8.2M14 11l-2 8.2" fill="none" stroke="#FFFFFF" strokeWidth="0.55" opacity="0.85" />
    </svg>
  )
}
