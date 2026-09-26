import { useEffect, useRef, useState } from 'react'
import { useReduceMotion } from '../../hooks/useReduceMotion'
import {
  mapOrderStatusToTrackingStep,
  type DeliveryStages,
  type TrackingStep,
  type TrackingStepKey,
} from '../../features/orders/tracking'
import { stepCenter, travelDuration } from '../../features/orders/trackerLayout'
import { Icon } from '../ui/Icon'
import { COURIER_SCOOTER_SIZE, CourierScooter } from './CourierScooter'
import { DeliveredConfetti } from './DeliveredConfetti'

type Props = {
  status: string | null | undefined
  /** Hora de cada transición real (ISO), si el backend ya la tiene. */
  times?: Partial<Record<TrackingStepKey | 'cancelled', string | null | undefined>>
  /** Etapas del reparto (Recogiendo / En camino) si el backend las reporta; sin ellas esos pasos no se activan. */
  stages?: DeliveryStages
  /** Animaciones (latido y motico); además respeta "reducir movimiento". */
  animated?: boolean
}

const MARKER = 28
/** Carril por encima de los círculos por donde viaja la motico. */
const LANE = 44
const LINE = 4

function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function stepA11yLabel(step: TrackingStep): string {
  switch (step.state) {
    case 'done':
      return `${step.label}, completado`
    case 'current':
      return `${step.label}, paso actual`
    case 'unavailable':
      return `${step.label}, todavía no disponible`
    default:
      return `${step.label}, pendiente`
  }
}

function Marker({ state, animated }: { state: TrackingStep['state']; animated: boolean }) {
  if (state === 'done') {
    return (
      <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="relative w-7 h-7 flex items-center justify-center">
        <span className={`absolute inset-0 rounded-full bg-primary/25 ${animated ? 'tracker-pulse' : ''}`} />
        <span className="relative w-6 h-6 rounded-full border-[3px] border-primary bg-surface flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-primary" />
        </span>
      </span>
    )
  }
  return (
    <span
      className={`w-7 h-7 rounded-full border-2 ${
        state === 'unavailable' ? 'border-dashed border-border bg-transparent' : 'border-border bg-surface'
      }`}
    />
  )
}

/**
 * Recorrido del pedido en horizontal: los pasos van uno al lado del otro unidos por una línea que
 * se va llenando, y una motico de delivery viaja de un paso al siguiente cuando el pedido avanza.
 * Solo dibuja lo que calcula `mapOrderStatusToTrackingStep`: los pasos que el backend aún no reporta
 * se ven pero nunca se activan, y un estado desconocido no rompe nada.
 */
export function OrderTracker({ status, times, stages, animated = true }: Props) {
  const view = mapOrderStatusToTrackingStep(status, stages)
  const reduceMotion = useReduceMotion()
  const motion = animated && !reduceMotion

  const count = view.steps.length
  // La motico se queda en Entregado cuando el pedido termina (ese paso se dibuja como "done").
  const scooterIndex = view.cancelled || view.unknown ? -1 : status === 'COMPLETED' ? count - 1 : view.currentIndex

  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [position, setPosition] = useState<number | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [hopping, setHopping] = useState(false)
  const placedAt = useRef<number | null>(null)
  // Se celebra solo si el pedido se entrega MIENTRAS se mira la pantalla, no al abrir uno ya entregado.
  const openedCompleted = useRef(status === 'COMPLETED')
  const [celebrating, setCelebrating] = useState(false)

  // Ancho real del recorrido: las columnas son iguales y la motico viaja entre sus centros.
  useEffect(() => {
    const node = trackRef.current
    if (!node) return
    const measure = () => setWidth(Math.round(node.getBoundingClientRect().width))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [view.cancelled])

  useEffect(() => {
    if (width <= 0 || scooterIndex < 0) return
    const target = stepCenter(scooterIndex, count, width)

    // Primera vez: si el pedido ya avanzó, la motico sale del primer paso y llega al actual.
    if (placedAt.current === null) {
      placedAt.current = motion ? 0 : scooterIndex
      setDurationMs(0)
      setPosition(stepCenter(placedAt.current, count, width))
    }
    const from = placedAt.current
    placedAt.current = scooterIndex

    if (!motion || from === scooterIndex) {
      setDurationMs(0)
      setPosition(target)
      return
    }

    const travel = travelDuration(from, scooterIndex)
    const celebrate = status === 'COMPLETED' && !openedCompleted.current
    // Primero se pinta la posición de salida y recién después empieza el viaje. Con un temporizador
    // (no requestAnimationFrame) para que arranque también en pestañas que no dibujan cuadros.
    const start = window.setTimeout(() => {
      setDurationMs(travel)
      setPosition(target)
    }, 50)
    let hopTimer: number | undefined
    const arrival = window.setTimeout(() => {
      // Ya llegó: el saltito usa una transición corta, no la del viaje.
      setDurationMs(160)
      setHopping(true)
      hopTimer = window.setTimeout(() => setHopping(false), 300)
      if (celebrate) setCelebrating(true)
    }, travel + 50)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(arrival)
      window.clearTimeout(hopTimer)
    }
  }, [scooterIndex, width, count, motion, status])

  if (view.cancelled) {
    const at = formatTime(times?.cancelled)
    return (
      <div role="alert" data-testid="order-tracker-cancelled" className="flex items-center gap-3 rounded-r-lg bg-danger/10 p-3">
        <Icon name="alert" size={32} className="shrink-0 text-danger" />
        <div>
          <p className="text-h3 text-danger-text">Pedido cancelado</p>
          <p className="text-caption text-text-secondary">
            {at ? `Cancelado a las ${at}` : 'Si tienes dudas, contáctanos desde Ayuda.'}
          </p>
        </div>
      </div>
    )
  }

  const firstCenter = stepCenter(0, count, width)
  const lastCenter = stepCenter(count - 1, count, width)
  const lineTop = LANE + MARKER / 2 - LINE / 2
  const fill = position === null ? 0 : Math.max(0, Math.min(position, lastCenter) - firstCenter)
  const transition = durationMs > 0 ? `${durationMs}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none'

  return (
    <div data-testid="order-tracker">
      {view.unknown && (
        <p className="mb-1 text-caption text-text-secondary" data-testid="order-tracker-unknown">
          {view.headline}
        </p>
      )}

      <div ref={trackRef} className="relative" style={{ paddingTop: LANE }}>
        {/* Línea entre los centros del primer y último paso; la naranja se llena hasta la motico. */}
        {width > 0 && (
          <>
            <div
              aria-hidden="true"
              className="absolute rounded-full bg-border"
              style={{ top: lineTop, left: firstCenter, width: lastCenter - firstCenter, height: LINE }}
            />
            {scooterIndex >= 0 && (
              <div
                aria-hidden="true"
                data-testid="tracker-progress"
                className="absolute rounded-full bg-primary"
                style={{ top: lineTop, left: firstCenter, width: fill, height: LINE, transition: `width ${transition}` }}
              />
            )}
          </>
        )}

        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {view.steps.map((step) => {
            const muted = step.state === 'upcoming' || step.state === 'unavailable'
            const time = muted ? null : formatTime(times?.[step.key])
            return (
              <li
                key={step.key}
                data-testid={`tracker-step-${step.key}`}
                aria-label={stepA11yLabel(step)}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className="flex flex-col items-center text-center"
              >
                <Marker state={step.state} animated={motion} />
                <span
                  className={`mt-1 px-0.5 text-[11px] leading-tight sm:text-caption break-words ${
                    step.state === 'current'
                      ? 'font-bold text-text-primary'
                      : muted
                        ? 'text-text-tertiary'
                        : 'font-semibold text-text-primary'
                  }`}
                >
                  {step.label}
                </span>
                {time && <span className="text-[11px] leading-tight text-text-secondary">{time}</span>}
              </li>
            )
          })}
        </ol>

        {/* La motico de delivery: decorativa (el estado ya lo dicen los pasos). */}
        {width > 0 && scooterIndex >= 0 && position !== null && (
          <div
            aria-hidden="true"
            data-testid="tracker-scooter"
            className="pointer-events-none absolute top-0 left-0"
            style={{
              transform: `translate(${position - COURIER_SCOOTER_SIZE / 2}px, ${hopping ? -6 : 0}px)`,
              transition: `transform ${transition}`,
            }}
          >
            <CourierScooter />
          </div>
        )}

        {/* Celebración al llegar la motico a Entregado. */}
        {celebrating && width > 0 && (
          <DeliveredConfetti x={lastCenter} y={LANE + MARKER / 2} onDone={() => setCelebrating(false)} />
        )}
      </div>
    </div>
  )
}
