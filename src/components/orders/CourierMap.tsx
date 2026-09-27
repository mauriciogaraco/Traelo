import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl'
import { useReduceMotion } from '../../hooks/useReduceMotion'
import {
  DEFAULT_MAP_CENTER,
  MAP_STYLE_URL,
  MAP_ZOOM,
  boundsForPoints,
  fromBoundsTuple,
  isInsideBounds,
  routeFromPosition,
  toBoundsTuple,
  toLngLat,
  type LatLng,
  type MapBounds,
} from '../../features/maps'

/** Margen (fracción de lo visible) a partir del cual se considera que el mensajero se sale del mapa. */
const EDGE_MARGIN = 0.1
const SLIDE_MS = 900
const PRIMARY = '#F97316'
const STALE = '#A8A29E'
const SUCCESS = '#16A34A'
const ROUTE_SOURCE = 'traelo-route'
const STRAIGHT_SOURCE = 'traelo-straight'

type Props = {
  courierLatitude: number | null
  courierLongitude: number | null
  destinationLatitude: number | null
  destinationLongitude: number | null
  /** Ubicación vieja: el marcador se muestra atenuado (no es tiempo real). */
  stale: boolean
  /**
   * Recorrido por calles del backend (referencia ESTABLE: solo cambia cuando el servidor lo recalcula).
   * Sin él, si hay mensajero y destino, se dibuja una línea recta punteada de respaldo.
   */
  routePoints?: LatLng[] | null
  height?: number
  /** El mapa no pudo cargar (sin red al servidor de mapas): quien lo usa muestra el texto. */
  onLoadFailed?: () => void
}

const lineFeature = (points: LatLng[] | null) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates: (points ?? []).map(toLngLat) },
})

function courierElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', 'Ubicación del mensajero')
  el.style.cssText =
    'width:34px;height:34px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:background .3s'
  el.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-7h5l4 7M9 10l-1-3h3M14 10l1-3h2"/></svg>'
  return el
}

function destinationElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', 'Dirección de entrega')
  el.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="${SUCCESS}" stroke="#fff" stroke-width="1.4" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none"/></svg>`
  return el
}

/**
 * Mapa del seguimiento (MapLibre + OpenFreeMap, sin API key): mensajero (marcador propio, se desliza
 * entre posiciones) y, si existen coordenadas, el destino. La librería pesa, así que se baja SOLO
 * al abrir este mapa (import dinámico): el resto de la web no la carga. Cámara:
 *  - Al abrir encuadra mensajero + destino.
 *  - Mientras se "sigue" no se mueve en cada actualización: solo se reencuadra si el mensajero se
 *    sale de lo visible. Si la persona mueve el mapa, el modo seguir se apaga y aparece
 *    "Seguir mensajero" para volver a encuadrar. Nunca se la deja atrapada en una cámara automática.
 * Recibe solo números (no objetos) para que memo evite redibujar el mapa en cada tic del reloj.
 */
function CourierMapView({
  courierLatitude,
  courierLongitude,
  destinationLatitude,
  destinationLongitude,
  stale,
  routePoints = null,
  height = 240,
  onLoadFailed,
}: Props) {
  const reduceMotion = useReduceMotion()
  const courier = useMemo<LatLng | null>(
    () => (courierLatitude !== null && courierLongitude !== null ? { latitude: courierLatitude, longitude: courierLongitude } : null),
    [courierLatitude, courierLongitude],
  )
  const destination = useMemo<LatLng | null>(
    () =>
      destinationLatitude !== null && destinationLongitude !== null
        ? { latitude: destinationLatitude, longitude: destinationLongitude }
        : null,
    [destinationLatitude, destinationLongitude],
  )
  const points = useMemo(() => [courier, destination].filter((p): p is LatLng => p !== null), [courier, destination])
  const remainingRoute = useMemo(
    () => (routePoints && routePoints.length >= 2 ? (courier ? routeFromPosition(routePoints, courier) : routePoints) : null),
    [routePoints, courier],
  )
  const straightLine = useMemo(() => (courier && destination ? [courier, destination] : null), [courier, destination])

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const libRef = useRef<typeof import('maplibre-gl') | null>(null)
  const courierMarkerRef = useRef<Marker | null>(null)
  const destinationMarkerRef = useRef<Marker | null>(null)
  const slideRef = useRef<number | null>(null)
  const visibleBoundsRef = useRef<MapBounds | null>(null)
  const fittedCountRef = useRef(points.length)
  const pointsRef = useRef(points)
  pointsRef.current = points

  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [following, setFollowing] = useState(true)
  const followingRef = useRef(true)
  followingRef.current = following

  const fitAll = useCallback((animate = true) => {
    const bounds = boundsForPoints(pointsRef.current)
    if (bounds && mapRef.current) mapRef.current.fitBounds(toBoundsTuple(bounds), { padding: 30, animate, duration: 600 })
  }, [])

  // Crea el mapa (una sola vez) cargando MapLibre bajo demanda.
  useEffect(() => {
    let cancelled = false
    let map: MapLibreMap | null = null
    void (async () => {
      try {
        const [lib] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')])
        if (cancelled || !containerRef.current) return
        libRef.current = lib
        const initial = boundsForPoints(pointsRef.current)
        map = new lib.Map({
          container: containerRef.current,
          style: MAP_STYLE_URL,
          center: toLngLat(pointsRef.current[0] ?? DEFAULT_MAP_CENTER),
          zoom: MAP_ZOOM.pin,
          ...(initial ? { bounds: toBoundsTuple(initial), fitBoundsOptions: { padding: 30, animate: false } } : {}),
          attributionControl: { compact: true },
        })
        mapRef.current = map
        const onGesture = (event: { originalEvent?: unknown }) => {
          // Solo un gesto de la persona (no una animación programática) apaga el modo "seguir".
          if (event.originalEvent) setFollowing(false)
        }
        map.on('dragstart', onGesture)
        map.on('zoomstart', onGesture)
        map.on('rotatestart', onGesture)
        map.on('moveend', () => {
          const b = map!.getBounds().toArray().flat()
          visibleBoundsRef.current = fromBoundsTuple(b)
        })
        map.on('load', () => {
          if (cancelled || !map) return
          for (const id of [ROUTE_SOURCE, STRAIGHT_SOURCE]) map.addSource(id, { type: 'geojson', data: lineFeature(null) })
          map.addLayer({ id: 'route-casing', type: 'line', source: ROUTE_SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': 9 } })
          map.addLayer({ id: 'route', type: 'line', source: ROUTE_SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': PRIMARY, 'line-width': 5 } })
          map.addLayer({ id: 'route-straight', type: 'line', source: STRAIGHT_SOURCE, paint: { 'line-color': '#665F5A', 'line-width': 3, 'line-dasharray': [2, 2] } })
          visibleBoundsRef.current = fromBoundsTuple(map.getBounds().toArray().flat())
          setReady(true)
        })
        map.on('error', () => {
          // Un tile suelto que falla no es grave; si el estilo nunca cargó, se avisa.
          if (!map!.isStyleLoaded() && !cancelled) {
            setFailed(true)
            onLoadFailed?.()
          }
        })
      } catch {
        if (!cancelled) {
          setFailed(true)
          onLoadFailed?.()
        }
      }
    })()
    return () => {
      cancelled = true
      if (slideRef.current !== null) window.cancelAnimationFrame(slideRef.current)
      courierMarkerRef.current?.remove()
      destinationMarkerRef.current?.remove()
      courierMarkerRef.current = null
      destinationMarkerRef.current = null
      map?.remove()
      mapRef.current = null
    }
    // Una sola vez por montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Marcador del mensajero: se crea/actualiza; entre posiciones se desliza (sin movimiento si se pidió reducirlo).
  useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!map || !lib) return
    if (!courier) {
      courierMarkerRef.current?.remove()
      courierMarkerRef.current = null
      return
    }
    if (!courierMarkerRef.current) {
      courierMarkerRef.current = new lib.Marker({ element: courierElement(), anchor: 'center' }).setLngLat(toLngLat(courier)).addTo(map)
    } else {
      const marker = courierMarkerRef.current
      const from = marker.getLngLat()
      const to = toLngLat(courier)
      if (slideRef.current !== null) window.cancelAnimationFrame(slideRef.current)
      if (reduceMotion || (from.lng === to[0] && from.lat === to[1])) {
        marker.setLngLat(to)
      } else {
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / SLIDE_MS)
          marker.setLngLat([from.lng + (to[0] - from.lng) * t, from.lat + (to[1] - from.lat) * t])
          slideRef.current = t < 1 ? window.requestAnimationFrame(step) : null
        }
        slideRef.current = window.requestAnimationFrame(step)
        // Si el navegador no entrega cuadros, igual queda en su sitio.
        window.setTimeout(() => marker.setLngLat(to), SLIDE_MS + 100)
      }
    }
    const element = courierMarkerRef.current.getElement()
    element.style.background = stale ? STALE : PRIMARY
    // ready en las dependencias: el mapa puede terminar de crearse después de la primera ubicación.
  }, [courier, stale, reduceMotion, ready, failed])

  useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!map || !lib) return
    if (!destination) {
      destinationMarkerRef.current?.remove()
      destinationMarkerRef.current = null
      return
    }
    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new lib.Marker({ element: destinationElement(), anchor: 'bottom' }).setLngLat(toLngLat(destination)).addTo(map)
    } else {
      destinationMarkerRef.current.setLngLat(toLngLat(destination))
    }
  }, [destination, ready, failed])

  // Rutas: por calles (naranja, o gris si es vieja) o línea recta punteada de respaldo.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    ;(map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined)?.setData(lineFeature(remainingRoute))
    ;(map.getSource(STRAIGHT_SOURCE) as GeoJSONSource | undefined)?.setData(lineFeature(remainingRoute ? null : straightLine))
    map.setPaintProperty('route', 'line-color', stale ? '#786F69' : PRIMARY)
  }, [remainingRoute, straightLine, stale, ready])

  // Cámara: encuadra al aparecer los puntos y reencuadra solo si el mensajero se sale de lo visible.
  useEffect(() => {
    if (!mapRef.current || !followingRef.current || points.length === 0) return
    const visible = visibleBoundsRef.current
    if (!visible) {
      if (points.length > fittedCountRef.current) {
        fittedCountRef.current = points.length
        fitAll()
      }
      return
    }
    const target = courier ?? destination
    if (target && !isInsideBounds(target, visible, EDGE_MARGIN)) fitAll()
  }, [courier, destination, points.length, ready, fitAll])

  if (failed) return null

  return (
    <div className="relative overflow-hidden rounded-r-md bg-surface-muted" style={{ height }} data-testid="courier-map">
      {/* Sin "absolute": la hoja de MapLibre fija position:relative en su contenedor y anularía el inset. */}
      <div ref={containerRef} className="w-full h-full" data-testid="native-map" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-caption text-text-secondary" role="status">
          Cargando mapa…
        </div>
      )}
      {!following && courier && (
        <button
          type="button"
          data-testid="follow-courier"
          onClick={() => {
            setFollowing(true)
            fitAll()
          }}
          className="absolute bottom-3 left-3 z-10 rounded-full bg-surface px-3 py-2 text-caption font-semibold text-primary-text shadow-soft"
        >
          Seguir mensajero
        </button>
      )}
    </div>
  )
}

export const CourierMap = memo(CourierMapView)
