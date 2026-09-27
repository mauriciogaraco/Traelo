import { useEffect, useState } from 'react'

/** Reloj que se actualiza cada `intervalMs` (null = detenido: no hay nada que mostrar con la hora). */
export function useNow(intervalMs: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (intervalMs === null) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}
