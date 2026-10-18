import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getFreeDeliveryPromo, type FreeDeliveryPromo } from '../api/catalog'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { countdownParts, msUntil, startLabel } from '../features/promo/countdown'
import { track } from '../analytics'
import { promoHomeHref, promoViewState } from '../features/promo/promo'

type PromoState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; promo: FreeDeliveryPromo }

/**
 * Pantalla de la promoción "primera mensajería gratis" (San Antonio de los Baños). Todo sale del servidor:
 * el contador (5 + pedidos completados de la localidad, hasta 15), cuántas mensajerías gratis quedan y el
 * código que lleva el enlace. Solo se regala la MENSAJERÍA, nunca los productos. "Pide ahora" lleva al Home
 * de esa localidad con el código en el enlace; el servidor valida al pedir (primer pedido, cupos, localidad).
 */
export function PromoPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<PromoState>({ kind: 'loading' })

  const load = useCallback(() => {
    setState({ kind: 'loading' })
    getFreeDeliveryPromo().then(
      (promo) => setState({ kind: 'ready', promo }),
      () => setState({ kind: 'error' }),
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Visita a la pantalla de la promo (una vez por estado cargado, no en cada tic de la cuenta regresiva).
  // Lleva SU localidad (San Antonio) aunque la persona esté comprando en otra.
  useEffect(() => {
    if (state.kind !== 'ready') return
    track('promo_view', { properties: { cityCode: state.promo.cityCode, state: promoViewState(state.promo) } })
  }, [state])

  return (
    <div className="px-4 lg:px-6 pt-3 lg:pt-6 max-w-xl mx-auto animate-fade-in">
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-hero p-5 lg:p-8 text-white">
        <p className="text-caption font-semibold uppercase tracking-wide text-white/90">San Antonio de los Baños</p>
        <h1 className="mt-1 text-h1 lg:text-display [text-shadow:0_1px_6px_rgba(0,0,0,0.25)]">
          Recibe tu primera mensajería gratis
        </h1>
        <p className="mt-2 text-body text-white/95">
          Haz tu primer pedido en Tráelo y nosotros pagamos la mensajería. Solo la mensajería es gratis: los
          productos los pagas normal.
        </p>
      </section>

      <div className="mt-4 space-y-4">
        {state.kind === 'loading' && (
          <div role="status" aria-label="Cargando la promoción" className="space-y-3">
            <Skeleton className="h-24 rounded-r-lg" />
            <Skeleton className="h-12 rounded-r-lg" />
          </div>
        )}

        {state.kind === 'error' && (
          <div className="rounded-r-lg bg-surface border border-border p-4 space-y-3">
            <p className="text-body text-text-primary">No pudimos cargar la promoción. Revisa tu conexión e inténtalo de nuevo.</p>
            <Button variant="outline" onClick={load}>
              Reintentar
            </Button>
          </div>
        )}

        {state.kind === 'ready' && state.promo.upcoming && <PromoCountdown promo={state.promo} onStart={load} />}

        {state.kind === 'ready' && !state.promo.upcoming && (
          <PromoStatus promo={state.promo} onOrder={(code) => {
              track('promo_click', { properties: { cityCode: state.promo.cityCode } })
              navigate(promoHomeHref({ cityCode: state.promo.cityCode, code }))
            }}
          />
        )}

        <p className="text-caption text-text-secondary">
          Válido para tu primer pedido en Tráelo, en negocios de San Antonio de los Baños, hasta agotar las
          mensajerías gratis. No se puede combinar con canje de puntos.
        </p>
        <Link to="/" className="inline-block text-body-sm font-semibold text-primary-text hover:underline">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}

function PromoStatus({ promo, onOrder }: { promo: FreeDeliveryPromo; onOrder: (code: string) => void }) {
  const { current, max } = promo.counter
  const percent = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0

  if (!promo.active || !promo.code) {
    return (
      <div className="rounded-r-lg bg-surface border border-border p-4 space-y-1" role="status">
        <p className="text-h3 text-text-primary">{promo.exhausted ? 'La promoción ya se agotó' : 'La promoción no está disponible por ahora'}</p>
        <p className="text-body text-text-secondary">
          {promo.exhausted
            ? 'Ya se entregaron todas las mensajerías gratis. Gracias por tu interés.'
            : 'Vuelve a revisar pronto. Mientras tanto, puedes pedir normalmente.'}
        </p>
      </div>
    )
  }

  const code = promo.code
  return (
    <>
      <section aria-label="Contador de la promoción" className="rounded-r-lg bg-surface border border-border p-4 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-h2 text-text-primary">
              {promo.remaining === 1 ? 'Queda 1 mensajería gratis' : `Quedan ${promo.remaining} mensajerías gratis`}
            </p>
            <p className="text-caption text-text-secondary">Cupos de la promoción</p>
          </div>
          <p className="text-display font-extrabold text-primary-text tabular-nums" aria-label={`${current} de ${max}`}>
            {current}/{max}
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-label="Avance de la promoción"
          className="h-3 w-full overflow-hidden rounded-full bg-primary-soft"
        >
          <div className="h-full rounded-full bg-gradient-primary transition-[width] duration-700" style={{ width: `${percent}%` }} />
        </div>
      </section>
      <Button fullWidth size="lg" onClick={() => onOrder(code)}>
        Pide ahora
      </Button>
    </>
  )
}

/** Pausa antes de volver a pedir el estado al llegar a 0: da margen a que el servidor ya marque la promo como activa. */
const REFETCH_AFTER_ZERO_MS = 1500

/**
 * Cuenta regresiva hasta que arranca la promoción. Cuenta contra la hora del SERVIDOR (no la del teléfono) y,
 * al llegar a 0, vuelve a pedir el estado: la pantalla pasa sola al contador y al botón "Pide ahora".
 */
function PromoCountdown({ promo, onStart }: { promo: FreeDeliveryPromo; onStart: () => void }) {
  // Diferencia entre el reloj del servidor y el del teléfono, medida al recibir el estado.
  const offsetMs = useMemo(() => Date.parse(promo.serverTime) - Date.now(), [promo.serverTime])
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const parts = countdownParts(msUntil(promo.startsAt, nowMs, offsetMs))

  useEffect(() => {
    if (!parts.done) return
    const timer = window.setTimeout(onStart, REFETCH_AFTER_ZERO_MS)
    return () => window.clearTimeout(timer)
  }, [parts.done, onStart, promo.serverTime])

  const label = startLabel(new Date(promo.startsAt), new Date(promo.serverTime))
  const boxes: { value: number; unit: string }[] = [
    ...(parts.days > 0 ? [{ value: parts.days, unit: parts.days === 1 ? 'día' : 'días' }] : []),
    { value: parts.hours, unit: 'horas' },
    { value: parts.minutes, unit: 'min' },
    { value: parts.seconds, unit: 'seg' },
  ]

  return (
    <section aria-label="Cuenta regresiva de la promoción" className="rounded-r-lg bg-surface border border-border p-4 space-y-3 text-center">
      <p className="text-h3 text-text-primary">{parts.done ? '¡Ya empieza!' : `La promoción empieza ${label}`}</p>
      <div role="timer" aria-live="off" className="flex justify-center gap-2">
        {boxes.map((box) => (
          <div key={box.unit} className="min-w-[64px] rounded-r-md bg-primary-soft px-2 py-2">
            <p className="text-display font-extrabold text-primary-text tabular-nums leading-none">{String(box.value).padStart(2, '0')}</p>
            <p className="mt-1 text-caption text-text-secondary">{box.unit}</p>
          </div>
        ))}
      </div>
      <p className="text-caption text-text-secondary">
        {parts.done ? 'Un momento, estamos abriendo la promoción…' : 'Vuelve a esta pantalla cuando llegue la hora: el botón aparecerá solo.'}
      </p>
    </section>
  )
}
