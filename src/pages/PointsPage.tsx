import { useCallback, useEffect, useState } from 'react'
import { AuthPrompt } from '../components/auth/AuthPrompt'
import { RewardsPanel } from '../components/rewards/RewardsPanel'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { refreshPoints } from '../services/pointsService'
import { usePointsStore } from '../store/pointsStore'
import type { PointsTransaction } from '../types/backend/points'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function TransactionRow({ item }: { item: PointsTransaction }) {
  const positive = item.points > 0
  const sign = positive ? '+' : '−'
  const gift = item.type === 'FIRST_ORDER_BONUS' || item.type === 'REDEMPTION' || item.type === 'REFERRAL_REWARD'
  return (
    <li
      data-testid={`points-row-${item.id}`}
      aria-label={`${positive ? 'Ganaste' : item.type === 'REDEMPTION' ? 'Usaste' : 'Se retiraron'} ${Math.abs(item.points)} puntos. ${item.reason}. Saldo ${item.balanceAfter}`}
      className="flex items-center gap-3 rounded-r-lg bg-surface border border-border/60 p-3"
    >
      <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-base ${positive ? 'bg-gold-soft' : 'bg-danger-soft'}`}>
        {gift ? '🎁' : positive ? '↑' : '↓'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary line-clamp-2">{item.reason}</p>
        <p className="text-caption text-text-secondary">
          {formatDate(item.createdAt)} · Saldo {item.balanceAfter}
        </p>
      </div>
      <span className={`text-h3 shrink-0 ${positive ? 'text-gold-text' : 'text-danger-text'}`}>
        {sign}
        {Math.abs(item.points)}
      </span>
    </li>
  )
}

/** "Puntos" (`PointsScreen` de mobile): saldo, cómo se ganan, recompensas y el historial completo. */
export function PointsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showToast } = useToast()
  const loaded = usePointsStore((state) => state.loaded)
  const balance = usePointsStore((state) => state.balance)
  const bonus = usePointsStore((state) => state.firstOrderBonus)
  const transactions = usePointsStore((state) => state.transactions)

  const [refreshing, setRefreshing] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    const ok = await refreshPoints()
    setFailed(!ok)
    return ok
  }, [])

  useEffect(() => {
    if (isAuthenticated) void load()
  }, [isAuthenticated, load])

  const handleRefresh = async () => {
    setRefreshing(true)
    const ok = await load()
    setRefreshing(false)
    showToast(ok ? 'Puntos actualizados' : 'No pudimos actualizar tus puntos', ok ? 'success' : 'error')
  }

  if (isLoading) {
    return (
      <div className="px-4 lg:px-0 pt-6">
        <RowsSkeleton rows={4} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="px-4 lg:px-0 pt-6 max-w-2xl mx-auto">
        <AuthPrompt
          title="Gana puntos por tus pedidos"
          description="Crea tu cuenta y canjea tus puntos por productos dentro de Tráelo. Pedir sin cuenta sigue siendo posible."
        />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-5 max-w-2xl mx-auto">
      <div className="rounded-r-lg bg-gradient-hero p-6 text-center text-white shadow-card space-y-1">
        <span className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl" aria-hidden="true">
          ⭐
        </span>
        <p className="font-semibold opacity-90">Tus puntos</p>
        <p className="text-[40px] font-extrabold leading-tight" data-testid="points-screen-balance">
          {loaded ? balance.toLocaleString('es') : '—'}
        </p>
        <p className="text-caption opacity-90">Gana puntos por tus pedidos realizados y canjéalos por productos dentro de Tráelo.</p>
      </div>

      {bonus.available && (
        <div className="flex items-center gap-3 rounded-r-lg bg-gold-soft p-4" data-testid="points-bonus-banner">
          <span className="text-2xl" aria-hidden="true">🎁</span>
          <div>
            <p className="font-semibold text-text-primary">Regalo de bienvenida</p>
            <p className="text-caption text-text-secondary">
              Tu primer pedido desde la web te regala {bonus.points} puntos, además de los que ganes por su servicio.
            </p>
          </div>
        </div>
      )}

      {failed && (
        <div className="rounded-r-lg bg-gold-soft p-4 space-y-2" data-testid="points-error">
          <p className="text-caption text-gold-text">
            {loaded ? 'No pudimos actualizar tus puntos. Mostramos lo último que sabemos.' : 'No pudimos cargar tus puntos.'}
          </p>
          <Button variant="outline" size="sm" loading={refreshing} onClick={() => void handleRefresh()}>
            Reintentar
          </Button>
        </div>
      )}

      <RewardsPanel />

      <h2 className="text-h3 text-text-primary">Historial</h2>

      {loaded && transactions.length === 0 ? (
        <div data-testid="points-empty">
          <EmptyState icon="star" title="Todavía no tienes puntos" description="Haz tu primer pedido: cuando lo recibas, tus puntos aparecen aquí." />
        </div>
      ) : !loaded ? (
        <RowsSkeleton rows={3} />
      ) : (
        <ul className="space-y-2">
          {transactions.map((item) => (
            <TransactionRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
