import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { getPushSupport, isSubscribed, subscribeToPush, unsubscribeFromPush, type PushSupport } from '../services/pushService'
import { useNotificationsStore } from '../store/notificationsStore'

function formatWhen(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return new Date(timestamp).toLocaleDateString('es')
}

/** Activar/desactivar los avisos de pedido en este navegador (Web Push). */
function PushToggle() {
  const [support, setSupport] = useState<PushSupport>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    setSupport(getPushSupport())
    setSubscribed(await isSubscribed())
  }

  useEffect(() => {
    void refresh()
  }, [])

  if (support === 'unsupported') return null

  if (support === 'denied') {
    return (
      <div className="rounded-r-lg bg-surface-muted p-4">
        <p className="text-caption text-text-secondary">
          Bloqueaste los avisos de este sitio. Actívalos desde los permisos del navegador si quieres recibirlos.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-r-lg bg-surface border border-border/60 p-4 space-y-2" data-testid="push-toggle">
      <p className="font-semibold text-text-primary">Avisos de pedido en este navegador</p>
      <p className="text-caption text-text-secondary">
        {subscribed
          ? 'Te avisamos aquí cuando tu pedido cambie de estado.'
          : 'Actívalos para saber, sin abrir la web, cuándo tu pedido va en camino.'}
      </p>
      <Button
        size="sm"
        variant={subscribed ? 'outline' : 'primary'}
        loading={busy}
        onClick={async () => {
          setBusy(true)
          if (subscribed) await unsubscribeFromPush()
          else await subscribeToPush()
          await refresh()
          setBusy(false)
        }}
      >
        {subscribed ? 'Desactivar' : 'Activar avisos'}
      </Button>
    </div>
  )
}

/** "Notificaciones" (`NotificationsScreen` de mobile): buzón local de Web Push de este navegador. */
export function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const items = useNotificationsStore((state) => state.items)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const clear = useNotificationsStore((state) => state.clear)

  const [newIds] = useState(() => new Set(useNotificationsStore.getState().items.filter((n) => !n.read).map((n) => n.id)))

  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  const invite = useMemo(
    () =>
      !authLoading && !isAuthenticated ? (
        <div className="rounded-r-lg bg-surface border border-border/60 p-4 space-y-2" data-testid="notifications-register-invite">
          <p className="font-semibold text-text-primary">Recibe avisos de tus pedidos</p>
          <p className="text-caption text-text-secondary">
            Crea tu cuenta gratis y te avisamos cuando tu pedido cambie de estado. Es opcional: puedes seguir pidiendo sin cuenta.
          </p>
          <div className="flex gap-2">
            <Link to="/registro" className="inline-flex min-h-9 items-center rounded-r-md bg-gradient-primary px-4 text-sm font-semibold text-white">
              Crear cuenta
            </Link>
            <Link to="/login" className="inline-flex min-h-9 items-center rounded-r-md border border-primary px-4 text-sm font-semibold text-primary-text">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      ) : null,
    [authLoading, isAuthenticated],
  )

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-h1 text-text-primary">Notificaciones</h1>

      <PushToggle />
      {invite}

      {items.length === 0 ? (
        <EmptyState icon="bell" title="Sin notificaciones" description="Aquí verás las novedades y avisos de tus pedidos." />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => {
              const isNew = newIds.has(item.id)
              return (
                <li
                  key={item.id}
                  className={`rounded-r-lg bg-surface p-3 flex gap-3 ${isNew ? 'border-[1.5px] border-primary' : 'border border-border/60'}`}
                >
                  <span className="w-11 h-11 shrink-0 rounded-full bg-gradient-primary text-white flex items-center justify-center">
                    🔔
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary flex-1 min-w-0">{item.title}</p>
                      {isNew && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" aria-hidden="true" />}
                    </div>
                    {item.body && <p className="text-body text-text-secondary">{item.body}</p>}
                    <p className="text-caption text-text-tertiary">{formatWhen(item.receivedAt)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <Button variant="outline" fullWidth onClick={clear}>
            Borrar todo
          </Button>
        </>
      )}
    </div>
  )
}
