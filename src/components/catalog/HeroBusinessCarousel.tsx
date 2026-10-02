import { useEffect, useRef, useState } from 'react'

const IMAGES = [
  '/assets/hero/cronos.webp',
  '/assets/hero/dlm.webp',
  '/assets/hero/ella-y-yo.webp',
  '/assets/hero/las-pamitas.webp',
  '/assets/hero/los-reales-electrodomesticos.webp',
  '/assets/hero/los-macus.webp',
  '/assets/hero/mercadito.webp',
  '/assets/hero/mercado-daf.webp',
]
const INTERVAL_MS = 4500

/** ¿Conviene quedarse en la primera foto? (reducir movimiento o "ahorro de datos" del navegador). */
function staticHero(): boolean {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  return Boolean(reduceMotion || saveData)
}

/**
 * Fondo del hero de Home — `HeroBusinessCarousel` de mobile: fotos de negocios en carrusel con un
 * velo oscuro para que el título y el buscador se lean. Decorativo (oculto a lectores de pantalla).
 * Para no gastar datos, cada foto se descarga recién cuando le toca, y con "reducir movimiento" o
 * "ahorro de datos" queda fija en la primera.
 */
export function HeroBusinessCarousel() {
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState<ReadonlySet<number>>(() => new Set([0]))
  const indexRef = useRef(0)
  const readyRef = useRef<ReadonlySet<number>>(ready)
  readyRef.current = ready

  useEffect(() => {
    if (staticHero()) return
    const requested = new Set<number>([0])
    const timer = window.setInterval(() => {
      const next = (indexRef.current + 1) % IMAGES.length
      // Solo avanza cuando la siguiente ya bajó; si no, la pide y espera a la próxima vuelta.
      if (readyRef.current.has(next)) {
        indexRef.current = next
        setIndex(next)
      } else if (!requested.has(next)) {
        requested.add(next)
        const img = new Image()
        img.onload = () => setReady((prev) => new Set(prev).add(next))
        img.src = IMAGES[next]!
      }
    }, INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 bg-primary-hover" aria-hidden="true">
      {IMAGES.map((src, i) =>
        ready.has(i) ? (
          <img
            key={src}
            src={src}
            alt=""
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null,
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,17,13,0.28),rgba(23,17,13,0.42),rgba(23,17,13,0.68))]" />
    </div>
  )
}
