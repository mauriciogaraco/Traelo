import { SUPPORT_WHATSAPP } from '../../lib/config'

/** "5358365388" → "+53 58365388" */
const SUPPORT_DISPLAY = `+${SUPPORT_WHATSAPP.slice(0, 2)} ${SUPPORT_WHATSAPP.slice(2)}`

/**
 * Cartel discreto de ayuda con enlace a WhatsApp. Va dentro del flujo normal
 * de la página (no es fijo), así nunca tapa botones ni el menú inferior.
 */
export function HelpBanner({ className = '' }: { className?: string }) {
  return (
    <a
      href={`https://wa.me/${SUPPORT_WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-3.5 py-2.5 transition-colors active:bg-green-100 ${className}`}
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-success text-white"
        aria-hidden="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.59 5.99L0 24l6.21-1.63a11.96 11.96 0 0 0 5.85 1.49h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.41ZM12.07 21.84h-.01a9.94 9.94 0 0 1-5.07-1.39l-.36-.21-3.69.97.99-3.6-.23-.37a9.93 9.93 0 0 1-1.53-5.27c0-5.49 4.46-9.95 9.95-9.95 2.66 0 5.16 1.03 7.04 2.91a9.88 9.88 0 0 1 2.91 7.04c0 5.49-4.47 9.95-9.96 9.95Z" />
        </svg>
      </span>
      <span className="min-w-0 text-[13px] leading-snug text-green-900">
        <span className="font-bold">¿Necesitas ayuda?</span> Escríbenos al{' '}
        <span className="font-bold whitespace-nowrap">{SUPPORT_DISPLAY}</span>
      </span>
    </a>
  )
}
