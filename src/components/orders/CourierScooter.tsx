/** Alto/ancho del dibujo (px). */
export const COURIER_SCOOTER_SIZE = 40

/**
 * Motico de delivery con su mensajero (casco, torso inclinado, brazo y caja de reparto atrás).
 * Decorativa: el estado del pedido ya lo dicen los pasos, por eso va oculta a lectores de pantalla.
 */
export function CourierScooter({ size = COURIER_SCOOTER_SIZE }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {/* Ruedas */}
      <circle cx="9" cy="30" r="5" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2.6" />
      <circle cx="32" cy="30" r="5" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2.6" />
      {/* Carrocería */}
      <path
        d="M9 30h8l3-9h6l3 9"
        fill="none"
        stroke="rgb(var(--c-primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 21l3-9h-4" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Caja de reparto */}
      <rect x="2" y="10" width="9" height="8" rx="2" fill="rgb(var(--c-primary-pressed))" stroke="white" strokeWidth="1" />
      {/* Torso y brazo */}
      <rect x="11" y="11" width="7" height="11" rx="3.5" fill="rgb(var(--c-text))" transform="rotate(14 14.5 16.5)" />
      <rect x="15" y="15" width="10" height="3" rx="1.5" fill="rgb(var(--c-text))" transform="rotate(-8 20 16.5)" />
      {/* Casco con visera */}
      <circle cx="17.5" cy="6.5" r="4.5" fill="rgb(var(--c-primary-pressed))" stroke="white" strokeWidth="1" />
      <rect x="18.5" y="5" width="5" height="3" rx="1.5" fill="rgb(var(--c-text))" />
    </svg>
  )
}
