import { useEffect, type CSSProperties } from 'react'

const DURATION_MS = 1500
const PARTICLES = 16
const PALETTE = ['#F97316', '#FBBF24', '#FCD34D', '#16A34A', '#EA580C']

// Reparto fijo (sin Math.random) para que el estallido sea el mismo cada vez: ángulos parejos hacia
// arriba y los lados, con alcance, giro y tamaño que varían por partícula.
const PIECES = Array.from({ length: PARTICLES }, (_, index) => {
  const angle = -Math.PI * (0.05 + (0.9 * index) / (PARTICLES - 1)) + ((index % 2) * 0.12 - 0.06)
  return {
    dx: Math.cos(angle) * (34 + (index % 4) * 9),
    dy: Math.sin(angle) * (34 + ((index * 3) % 5) * 8),
    spin: (index % 2 ? 1 : -1) * (180 + (index % 3) * 120),
    width: 5 + (index % 3) * 2,
    height: 8 - (index % 2) * 3,
    color: PALETTE[index % PALETTE.length],
  }
})

/**
 * Estallido de confeti que sale del paso "Entregado" cuando la motico llega. Decorativo: no recibe
 * toques ni se anuncia a lectores de pantalla. `x`/`y` son el origen (px) dentro del recorrido.
 */
export function DeliveredConfetti({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, DURATION_MS)
    return () => window.clearTimeout(timer)
    // Una sola vez por montaje: quien lo pinta lo desmonta al terminar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: x, top: y }}>
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece absolute rounded-[2px]"
          style={
            {
              width: piece.width,
              height: piece.height,
              background: piece.color,
              '--dx': `${piece.dx}px`,
              '--dy': `${piece.dy}px`,
              '--spin': `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
