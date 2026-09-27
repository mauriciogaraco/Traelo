import { useEffect, useMemo, useRef, useState } from 'react'
import type { OrderAccess } from '../../api/orderAccess'
import { isTrackingActive, isTrackingVisible, type DeliveryStages } from '../../features/orders/tracking'
import { getTrackingPanelView, isMapAvailable, locationAgeMs } from '../../features/tracking'
import { useCourierTracking } from '../../hooks/useCourierTracking'
import { useNow } from '../../hooks/useNow'
import { Icon } from '../ui/Icon'
import { CourierMap } from './CourierMap'

type Props = {
  orderId: string
  /** null = no hay forma de consultar el pedido (ni cuenta ni token de invitado). */
  access: OrderAccess | null
  /** Estado real del pedido según el polling liviano del detalle. */
  orderStatus: string | null | undefined
  /** Etapas del reparto; el seguimiento en vivo solo se muestra desde "Recogiendo" (no en "Confirmado"). */
  stages?: DeliveryStages
  /** El seguimiento informó que el pedido terminó: que el detalle refresque su estado ya. */
  onOrderEnded?: () => void
}

/**
 * Seguimiento en vivo del pedido: mapa con el mensajero, frescura de la ubicación y avisos. Nunca
 * bloquea nada del pedido — sin mapa, sin GPS o sin internet solo cambia lo que se ve aquí.
 */
export function CourierTrackingPanel({ orderId, access, orderStatus, stages, onOrderEnded }: Props) {
  const enabled = isTrackingVisible(orderStatus, stages)
  const { tracking, receivedAt, error, loading } = useCourierTracking(orderId, access, { enabled })
  const [mapFailed, setMapFailed] = useState(false)

  // Avisa una vez cuando el seguimiento informa un estado final distinto del que ya conoce el detalle.
  const notifiedRef = useRef<string | null>(null)
  const trackedStatus = tracking?.status
  useEffect(() => {
    if (!trackedStatus || isTrackingActive(trackedStatus) || trackedStatus === orderStatus) return
    if (notifiedRef.current === trackedStatus) return
    notifiedRef.current = trackedStatus
    onOrderEnded?.()
  }, [trackedStatus, orderStatus, onOrderEnded])

  // Solo hay reloj corriendo mientras haya una ubicación cuya antigüedad mostrar.
  const now = useNow(enabled && tracking?.location ? 1000 : null)

  // Referencia estable mientras el servidor no recalcule la ruta: el mapa no redibuja la línea en cada consulta.
  const routeComputedAt = tracking?.route?.computedAt ?? null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const routePoints = useMemo(() => tracking?.route?.coordinates ?? null, [routeComputedAt])

  if (access === null) return null
  // Confirmado (mensajero asignado, todavía no va por el pedido): no hay seguimiento que mostrar.
  if (orderStatus === 'ASSIGNED' && !enabled) return null

  const ageMs = tracking && receivedAt !== null ? locationAgeMs(tracking.location, tracking.serverTime, receivedAt, now) : null
  const view = getTrackingPanelView({ orderStatus, tracking, error, loading, ageMs, mapAvailable: isMapAvailable() && !mapFailed })

  if (view.kind === 'hidden') return null

  if (view.kind === 'ended') {
    return (
      <p className="text-caption text-text-secondary" data-testid={`tracking-ended-${view.reason}`}>
        {view.message}
      </p>
    )
  }

  if (view.kind === 'loading') {
    return (
      <div className="flex items-center gap-2" data-testid="tracking-loading" role="status">
        <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
        <p className="font-semibold text-text-primary">Buscando la ubicación del mensajero…</p>
      </div>
    )
  }

  const destination = tracking?.destination ?? null
  return (
    <div className="space-y-2" data-testid="courier-tracking">
      <p className="flex items-center gap-2 font-semibold text-text-primary">
        <Icon name="location" size={20} className={view.live ? 'text-primary' : 'text-text-tertiary'} />
        {view.live ? 'Seguimiento en tiempo real' : 'Ubicación del mensajero'}
      </p>

      {view.showMap && (
        <CourierMap
          courierLatitude={view.courier?.latitude ?? null}
          courierLongitude={view.courier?.longitude ?? null}
          destinationLatitude={view.destination?.latitude ?? null}
          destinationLongitude={view.destination?.longitude ?? null}
          stale={!view.live}
          routePoints={view.routeKind === 'street' ? routePoints : null}
          onLoadFailed={() => setMapFailed(true)}
        />
      )}

      <p className="flex items-center gap-1.5 text-caption text-text-secondary" data-testid="tracking-caption" aria-live="polite">
        <span
          aria-hidden="true"
          className={`inline-block w-2 h-2 rounded-full ${view.live ? 'bg-success' : 'bg-text-tertiary'}`}
        />
        {view.caption}
      </p>

      {view.distanceLabel && (
        <p className="text-caption text-text-secondary" data-testid="tracking-distance">
          Tu mensajero está {view.distanceLabel}
        </p>
      )}

      {view.notice && (
        <p className="text-caption text-warning-text" data-testid="tracking-notice">
          {view.notice}
        </p>
      )}

      {destination && (
        <div className="flex items-start gap-2 text-body" data-testid="tracking-destination">
          <Icon name="location" size={16} className="mt-[3px] shrink-0 text-text-secondary" />
          <div>
            <p className="text-text-primary">{destination.address}</p>
            {destination.reference && <p className="text-caption text-text-secondary">{destination.reference}</p>}
          </div>
        </div>
      )}

      {!view.showMap && view.courier && (
        <p className="text-caption text-text-secondary" data-testid="tracking-no-map">
          El mapa no está disponible en este dispositivo.
        </p>
      )}
    </div>
  )
}
