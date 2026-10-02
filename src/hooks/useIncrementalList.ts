import { useEffect, useRef, useState } from 'react'

/**
 * Pinta una lista larga por tramos (equivalente web del `FlatList` virtualizado de mobile): los
 * primeros `pageSize` y, cuando el centinela se acerca a la pantalla, el siguiente tramo. Así un
 * catálogo de cientos de productos no traba el teléfono ni baja cientos de fotos de golpe.
 * Vuelve al primer tramo cuando cambia `resetKey` (otra búsqueda, orden o filtro).
 */
export function useIncrementalList<T>(items: T[], resetKey: unknown, pageSize = 24) {
  const [count, setCount] = useState(pageSize)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCount(pageSize)
  }, [resetKey, pageSize])

  const hasMore = count < items.length

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setCount((c) => c + pageSize)
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, pageSize, items])

  return { visible: items.slice(0, count), hasMore, sentinelRef, showMore: () => setCount((c) => c + pageSize) }
}
