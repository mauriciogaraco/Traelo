import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import logomarkWhite from '../../assets/traelo-logomark-white.png'
import { APP_DOWNLOAD } from '../../config/appDownload'
import { detectPlatform, formatMegabytes, useApkDownload, type DownloadState } from '../../hooks/useApkDownload'
import { useIsOnline } from '../../hooks/useIsOnline'
import { Icon } from '../ui/Icon'

const DownloadQr = lazy(() => import('./DownloadQr'))

const BENEFITS = [
  { emoji: '⚡', text: 'Pide en segundos' },
  { emoji: '🛵', text: 'Mensajero en vivo' },
  { emoji: '🎁', text: 'Puntos por pedido' },
  { emoji: '🔔', text: 'Avisos al instante' },
]

/** Ancla del flyer: el banner chico del Home (y el enlace /#descargar-app) llevan hasta aquí. */
export const APP_FLYER_ID = 'descargar-app'

/** Curva de aceleración suave: arranca y frena despacio. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

let activeScroll: (() => void) | null = null

/**
 * Desplaza la página hasta `targetY` con una animación propia (no depende del "smooth" del
 * navegador, que en algunos es brusco y que se desactiva si el sistema pide reducir movimiento).
 * Con "reducir movimiento" el recorrido es más corto, pero nunca un salto. Se detiene en cuanto la
 * persona toca la pantalla o usa la rueda, para no pelear con ella.
 */
function smoothScrollTo(targetY: number, onDone?: () => void): void {
  activeScroll?.()
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 2) {
    onDone?.()
    return
  }
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const duration = reduceMotion ? 550 : Math.min(1100, Math.max(650, Math.abs(distance) * 0.45))
  const startTime = performance.now()
  let frame = 0
  const stop = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
    activeScroll = null
  }
  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    window.scrollTo(0, startY + distance * easeInOutCubic(progress))
    if (progress < 1) frame = requestAnimationFrame(step)
    else {
      stop()
      onDone?.()
    }
  }
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchstart', stop, { passive: true })
  window.addEventListener('keydown', stop)
  activeScroll = stop
  frame = requestAnimationFrame(step)
}

/** Lleva al flyer con un desplazamiento suave y lo resalta al llegar, para que se note a dónde fue. */
export function scrollToAppFlyer(): void {
  const flyer = document.getElementById(APP_FLYER_ID)
  if (!flyer) return
  const rect = flyer.getBoundingClientRect()
  const header = document.querySelector('header')?.getBoundingClientRect().height ?? 0
  const visible = window.innerHeight - header
  // Centrado en lo que queda visible bajo el header; si el flyer es más alto que eso, arriba del todo.
  const offset = rect.height < visible ? (visible - rect.height) / 2 : 12
  const maxY = document.documentElement.scrollHeight - window.innerHeight
  const targetY = Math.max(0, Math.min(maxY, window.scrollY + rect.top - header - offset))
  smoothScrollTo(targetY, () => {
    flyer.classList.remove('flyer-highlight')
    void flyer.offsetWidth // reinicia la animación si se toca dos veces
    flyer.classList.add('flyer-highlight')
    flyer.querySelector<HTMLElement>('[data-flyer-cta]')?.focus({ preventScroll: true })
  })
}

/**
 * Flyer del Home para descargar la app de Android. La descarga muestra su progreso real (%, MB),
 * se puede cancelar, termina con una animación y los pasos para instalar, y siempre ofrece un
 * respaldo (enlace directo) para que nadie se quede con un botón que "no hace nada".
 */
export function AppDownloadFlyer() {
  const platform = useMemo(() => detectPlatform(), [])
  const online = useIsOnline()
  const { state, sizeBytes, loadSize, start, cancel, reset, directDownload } = useApkDownload()
  const ref = useRef<HTMLElement>(null)

  // Enlace directo al flyer (/#descargar-app): al aparecer, se lleva la vista hasta él.
  useEffect(() => {
    if (window.location.hash === `#${APP_FLYER_ID}`) window.setTimeout(scrollToAppFlyer, 150)
  }, [])

  // El tamaño del archivo se pide recién cuando el flyer aparece en pantalla.
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadSize()
        observer.disconnect()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadSize])

  const percent =
    state.status === 'downloading' && state.total ? Math.min(100, Math.round((state.received / state.total) * 100)) : null

  return (
    <section
      ref={ref}
      id={APP_FLYER_ID}
      aria-labelledby="app-flyer-title"
      className="relative overflow-hidden rounded-[28px] bg-gradient-hero text-white shadow-[0_18px_40px_-18px_rgb(var(--c-primary)/0.7)]"
    >
      {/* Fondo: círculos suaves para dar profundidad (decorativo). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10" />
        <span className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/10" />
        <span className="absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-white/5" />
      </div>

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10 lg:p-10">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-label backdrop-blur">
                <AndroidIcon className="h-3.5 w-3.5" />
                App para Android · Gratis
              </span>
              <h2 id="app-flyer-title" className="text-h1 lg:text-display text-white [text-wrap:balance]">
                Tráelo, ahora en tu teléfono
              </h2>
              <p className="max-w-md text-body text-white/90">
                Descarga la app y pide más rápido, con tus direcciones guardadas y tu pedido siempre a la vista.
              </p>
            </div>
            {/* En teléfono, el móvil decorativo va arriba a la derecha y más chico. */}
            <PhoneMockup state={state} percent={percent} className="lg:hidden w-[92px] shrink-0 -mr-1 mt-1" compact />
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className="flex items-center gap-2 rounded-r-md bg-white/[0.12] px-2.5 py-2 text-[13px] leading-tight font-semibold sm:px-3 sm:text-[14px]">
                <span aria-hidden="true" className="text-base leading-none">
                  {benefit.emoji}
                </span>
                {benefit.text}
              </li>
            ))}
          </ul>

          <DownloadCta
            state={state}
            percent={percent}
            sizeBytes={sizeBytes}
            platform={platform}
            online={online}
            onStart={start}
            onCancel={cancel}
            onReset={reset}
            onDirect={directDownload}
          />
        </div>

        <div className="hidden lg:flex flex-col items-center gap-5">
          <PhoneMockup state={state} percent={percent} className="w-[170px]" />
          {platform === 'desktop' && (
            <Suspense fallback={<div className="h-[148px] w-[148px] rounded-r-lg bg-white/20" />}>
              <DownloadQr url={`${window.location.origin}${APP_DOWNLOAD.url}`} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Botón y estados de la descarga ─────────────────────────────────────────────

interface DownloadCtaProps {
  state: DownloadState
  percent: number | null
  sizeBytes: number | null
  platform: ReturnType<typeof detectPlatform>
  online: boolean
  onStart: () => void
  onCancel: () => void
  onReset: () => void
  onDirect: () => void
}

function DownloadCta({ state, percent, sizeBytes, platform, online, onStart, onCancel, onReset, onDirect }: DownloadCtaProps) {
  const [pressed, setPressed] = useState(false)
  const sizeLabel = sizeBytes ? formatMegabytes(sizeBytes) : null

  if (platform === 'ios') {
    return (
      <div className="rounded-r-lg bg-white/15 p-4 backdrop-blur" role="note">
        <p className="font-semibold">Por ahora la app es solo para Android.</p>
        <p className="mt-1 text-caption text-white/85">Desde tu iPhone puedes pedir aquí mismo, en la web: es la misma Tráelo.</p>
      </div>
    )
  }

  if (state.status === 'downloading' || state.status === 'preparing') {
    const indeterminate = state.status === 'preparing' || percent === null
    return (
      <div className="rounded-r-lg bg-white/15 p-4 backdrop-blur space-y-3" aria-live="polite">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-bold">{state.status === 'preparing' ? 'Preparando la descarga…' : 'Descargando Tráelo…'}</p>
            <p className="text-caption text-white/85">
              {state.status === 'downloading'
                ? `${formatMegabytes(state.received)}${state.total ? ` de ${formatMegabytes(state.total)}` : ''} · no cierres esta página`
                : 'Conectando con el servidor'}
            </p>
          </div>
          {!indeterminate && <span className="text-h2 tabular-nums">{percent}%</span>}
        </div>
        <div
          role="progressbar"
          aria-label="Progreso de la descarga"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate ? undefined : (percent ?? undefined)}
          className="h-3 overflow-hidden rounded-full bg-black/20"
        >
          <div
            className="flyer-stripes h-full rounded-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: indeterminate ? '35%' : `${Math.max(4, percent ?? 0)}%` }}
          />
        </div>
        <button type="button" onClick={onCancel} className="text-caption font-semibold text-white/90 underline underline-offset-2 hover:text-white">
          Cancelar descarga
        </button>
      </div>
    )
  }

  if (state.status === 'done') {
    return (
      <div className="relative rounded-r-lg bg-surface p-4 text-text-primary shadow-float" aria-live="polite">
        <div className="flex items-start gap-3">
          <SuccessBadge />
          <div className="min-w-0">
            <p className="text-h3">{state.mode === 'progress' ? '¡Descarga lista!' : 'La descarga empezó'}</p>
            <p className="text-caption text-text-secondary">
              {state.mode === 'progress'
                ? `Abre «${APP_DOWNLOAD.fileName}» desde tus descargas para instalarla.`
                : 'Búscala en las descargas de tu navegador. Si no aparece, abre esta página en Chrome.'}
            </p>
          </div>
        </div>
        <InstallSteps />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption font-semibold">
          <button type="button" onClick={onDirect} className="text-primary-text underline underline-offset-2">
            ¿No se guardó? Descargar directo
          </button>
          <button type="button" onClick={onReset} className="text-text-secondary hover:text-text-primary">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {state.status === 'error' && (
        <p role="alert" className="rounded-r-md bg-black/20 px-3 py-2 text-caption font-semibold">
          {state.message} Inténtalo de nuevo o{' '}
          <button type="button" onClick={onDirect} className="underline underline-offset-2">
            descárgala directo
          </button>
          .
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          data-flyer-cta
          disabled={!online}
          onClick={() => {
            setPressed(true)
            onStart()
          }}
          onAnimationEnd={() => setPressed(false)}
          className={`group inline-flex min-h-14 items-center justify-center gap-3 rounded-r-lg bg-white px-6 text-[17px] font-bold text-[#C2410C] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
            pressed ? 'flyer-press' : online ? 'flyer-glow' : ''
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-white transition group-hover:scale-110">
            <DownloadIcon className="h-4 w-4" />
          </span>
          {state.status === 'error' ? 'Reintentar descarga' : 'Descargar para Android'}
        </button>
        <p className="text-caption text-white/85">
          {online ? (
            <>
              APK{sizeLabel ? ` · ${sizeLabel}` : ''} · Gratis
              {platform === 'desktop' && <span className="block lg:hidden">Descárgala desde tu teléfono Android.</span>}
            </>
          ) : (
            'Sin conexión: conéctate para descargarla.'
          )}
        </p>
      </div>
    </div>
  )
}

function InstallSteps() {
  return (
    <details className="group mt-3 rounded-r-md bg-surface-muted px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-semibold text-text-primary">
        ¿Cómo la instalo?
        <Icon name="chevron-down" size={18} className="text-text-secondary transition group-open:rotate-180" />
      </summary>
      <ol className="mt-2 space-y-1.5 text-caption text-text-secondary">
        <li>
          <b className="text-text-primary">1.</b> Abre el archivo descargado (en la notificación o en «Descargas»).
        </li>
        <li>
          <b className="text-text-primary">2.</b> Si Android lo pide, permite «Instalar apps desconocidas» para tu navegador.
        </li>
        <li>
          <b className="text-text-primary">3.</b> Toca «Instalar» y abre Tráelo. ¡Listo!
        </li>
      </ol>
    </details>
  )
}

// ── Teléfono ilustrado ────────────────────────────────────────────────────────

function PhoneMockup({
  state,
  percent,
  className = '',
  compact = false,
}: {
  state: DownloadState
  percent: number | null
  className?: string
  compact?: boolean
}) {
  const downloading = state.status === 'downloading' || state.status === 'preparing'
  const done = state.status === 'done'
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {/* Flecha que "cae" dentro del teléfono mientras se descarga. */}
      {downloading && (
        <span className="flyer-drop absolute left-1/2 -top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-float">
          <DownloadIcon className="h-4 w-4" />
        </span>
      )}
      <div className={`flyer-float rounded-[26px] border-[5px] border-[#1F1A16] bg-[#FFFCF8] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] ${compact ? 'p-1.5' : 'p-2.5'}`}>
        <div className="mx-auto mb-1.5 h-1 w-6 rounded-full bg-[#1F1A16]/20" />
        <div className="flex items-center gap-1.5 rounded-[12px] bg-gradient-hero p-1.5">
          <img src={logomarkWhite} alt="" className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
          {!compact && <span className="text-[11px] font-extrabold text-white">Tráelo</span>}
        </div>
        <div className={`relative mt-1.5 flex items-center justify-center rounded-[12px] bg-[#F1EDE6] ${compact ? 'h-[92px]' : 'h-[190px]'}`}>
          {done ? (
            <span className="flyer-pop flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A] text-white">
              <CheckIcon className="h-6 w-6" />
            </span>
          ) : downloading ? (
            <ProgressRing percent={percent} size={compact ? 52 : 92} />
          ) : (
            <div className="w-full space-y-1.5 px-2">
              {[0.9, 0.7, 0.8].map((w, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-4 w-4 shrink-0 rounded-[6px] bg-[#F97316]/70" />
                  <span className="h-2 rounded-full bg-[#1F1A16]/15" style={{ width: `${w * 100}%` }} />
                </div>
              ))}
              {!compact && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <span className="h-12 rounded-[8px] bg-white" />
                  <span className="h-12 rounded-[8px] bg-white" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ percent, size }: { percent: number | null; size: number }) {
  const stroke = size > 60 ? 8 : 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const value = percent ?? 25
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={percent === null ? 'animate-spin' : ''} style={{ transform: percent === null ? undefined : 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E2DB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
        />
      </svg>
      {percent !== null && (
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-[#1F1A16] tabular-nums">
          {percent}%
        </span>
      )}
    </div>
  )
}

// ── Éxito con "confeti" ───────────────────────────────────────────────────────

const BURST_COLORS = ['#F97316', '#FBBF24', '#16A34A', '#2563EB', '#E11D48', '#FB923C']

function SuccessBadge() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2
        const distance = 34 + (i % 3) * 10
        return {
          color: BURST_COLORS[i % BURST_COLORS.length]!,
          style: {
            '--dx': `${Math.cos(angle) * distance}px`,
            '--dy': `${Math.sin(angle) * distance}px`,
            '--rot': `${(i % 2 ? 1 : -1) * 180}deg`,
            animationDelay: `${(i % 4) * 30}ms`,
          } as CSSProperties,
        }
      }),
    [],
  )
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center" aria-hidden="true">
      {particles.map((p, i) => (
        <span key={i} className="flyer-burst absolute h-2 w-2 rounded-[2px]" style={{ ...p.style, backgroundColor: p.color }} />
      ))}
      <span className="flyer-pop flex h-11 w-11 items-center justify-center rounded-full bg-success text-white shadow-[0_6px_16px_-6px_rgb(var(--c-success)/0.8)]">
        <CheckIcon className="h-6 w-6" />
      </span>
    </span>
  )
}

// ── Íconos ────────────────────────────────────────────────────────────────────

function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

function AndroidIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48 19.4 6.3a.4.4 0 0 0-.7-.4l-1.84 3.2A11.2 11.2 0 0 0 12 8.04c-1.76 0-3.4.39-4.86 1.06L5.3 5.9a.4.4 0 0 0-.7.4L6.4 9.48A10 10 0 0 0 1.5 17.5h21a10 10 0 0 0-4.9-8.02ZM7 15.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  )
}
