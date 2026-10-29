import type { SVGProps } from 'react'

/** Ilustraciones de Halloween en SVG inline (decorativas, sin peticiones extra). Todas son aria-hidden. */
type ArtProps = SVGProps<SVGSVGElement>

const base = { 'aria-hidden': true, focusable: false } as const

export function Pumpkin(props: ArtProps) {
  return (
    <svg viewBox="0 0 48 44" {...base} {...props}>
      <path d="M24 10c0-3.5 1.2-6 4.5-7" fill="none" stroke="#65A30D" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="13" cy="26" rx="11" ry="15" fill="#EA580C" />
      <ellipse cx="35" cy="26" rx="11" ry="15" fill="#EA580C" />
      <ellipse cx="24" cy="26" rx="12" ry="16.5" fill="#F97316" />
      <path d="M14.5 23l4.2-6 4.2 6zM25.1 23l4.2-6 4.2 6z" fill="#1F1A16" />
      <path d="M14 31h20l-2.6 5.5-3.4-3.4-2 4.4-2-4.4-3.4 3.4z" fill="#1F1A16" />
    </svg>
  )
}

export function Bat(props: ArtProps) {
  return (
    <svg viewBox="0 0 40 20" {...base} {...props}>
      <path
        fill="currentColor"
        d="M20 5.5c-1.6 0-2.4 1.1-3 2.4C14 5.4 9 3.6 2 4.6c3 1.8 3.2 5.2 4.6 8.2 2-1.7 4.4-1.7 6.4.2 1-1.7 2-2.6 3.3-2.6.9 1.3 2.1 3.2 3.7 3.2s2.8-1.9 3.7-3.2c1.3 0 2.3.9 3.3 2.6 2-1.9 4.4-1.9 6.4-.2 1.4-3 1.6-6.4 4.6-8.2-7-1-12 .8-15 3.3-.6-1.3-1.4-2.4-3-2.4z"
      />
      <path fill="currentColor" d="M17.2 5.2l1.1-3 1.7 1.7 1.7-1.7 1.1 3z" />
    </svg>
  )
}

export function Ghost(props: ArtProps) {
  return (
    <svg viewBox="0 0 32 36" {...base} {...props}>
      <path
        fill="#FFF9F3"
        d="M16 2C8.3 2 3 7.8 3 15.5V34l4.6-3.6L12 34l4-3.6L20 34l4.4-3.6L29 34V15.5C29 7.8 23.7 2 16 2z"
      />
      <ellipse cx="12" cy="15" rx="2.2" ry="2.9" fill="#1F1A16" />
      <ellipse cx="20" cy="15" rx="2.2" ry="2.9" fill="#1F1A16" />
      <ellipse cx="16" cy="22" rx="2.4" ry="3" fill="#1F1A16" />
    </svg>
  )
}

export function WitchHat(props: ArtProps) {
  return (
    <svg viewBox="0 0 32 28" {...base} {...props}>
      <path d="M17 1c3 .2 4.4 1.4 5.6 4.6L25 17H8.5L13 7.5C14 4.4 15 1.2 17 1z" fill="#3B1A63" />
      <path d="M9.4 14.2h14.6l.8 3.3H8.6z" fill="#F97316" />
      <ellipse cx="16.5" cy="21" rx="14" ry="4.6" fill="#2A1148" />
    </svg>
  )
}

/** Telaraña de esquina (nace en la esquina superior izquierda; se voltea con CSS para la derecha). */
const WEB_SPOKES = [
  [1, 0],
  [0.933, 0.363],
  [0.707, 0.707],
  [0.363, 0.933],
  [0, 1],
] as const

function webRings(): string {
  const rings: string[] = []
  for (const r of [22, 42, 62]) {
    const pts = WEB_SPOKES.map(([x, y]) => [x * r, y * r] as const)
    let d = `M${pts[0]![0]} ${pts[0]![1]}`
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1]!
      const [cx, cy] = pts[i]!
      // Cada tramo se hunde un poco hacia la esquina, como una tela colgando entre los radios.
      d += ` Q${(px + cx) / 2 * 0.86} ${(py + cy) / 2 * 0.86} ${cx} ${cy}`
    }
    rings.push(d)
  }
  return rings.join(' ')
}
const WEB_RINGS = webRings()

export function Cobweb(props: ArtProps) {
  return (
    <svg viewBox="0 0 80 80" {...base} {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M0 0H80M0 0L74.6 29M0 0L56.6 56.6M0 0L29 74.6M0 0V80" />
        <path d={WEB_RINGS} />
      </g>
    </svg>
  )
}
