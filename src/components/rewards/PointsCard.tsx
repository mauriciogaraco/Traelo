import { Link } from 'react-router-dom'
import { nextReward } from '../../features/rewards'
import { useAuth } from '../../hooks/useAuth'
import { usePointsStore } from '../../store/pointsStore'
import { useRewardsStore } from '../../store/rewardsStore'

/**
 * Tus puntos, siempre a la vista (`PointsCard` de mobile): el saldo y, al tocarla, abre el
 * detalle. Sin cuenta es una invitación (nunca un requisito) a crearla para empezar a ganar.
 */
export function PointsCard() {
  const { isAuthenticated, isLoading } = useAuth()
  const loaded = usePointsStore((state) => state.loaded)
  const balance = usePointsStore((state) => state.balance)
  const bonus = usePointsStore((state) => state.firstOrderBonus)
  const rewards = useRewardsStore((state) => state.rewards)

  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <Link
        to="/registro"
        aria-label="Crea tu cuenta, gana puntos por tus pedidos y canjéalos por productos"
        className="flex items-center gap-3 rounded-r-lg bg-gradient-to-br from-gold-soft to-primary-soft p-4 hover:brightness-95 transition"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl" aria-hidden="true">
          ⭐
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gold-text">Gana puntos por tus pedidos</p>
          <p className="text-caption text-warning-text">Crea tu cuenta gratis y canjéalos por productos dentro de Tráelo.</p>
        </div>
      </Link>
    )
  }

  const next = nextReward(rewards)

  return (
    <Link
      to="/puntos"
      aria-label={loaded ? `Tus puntos: ${balance}. Ver detalle` : 'Tus puntos. Ver detalle'}
      data-testid="points-card"
      className="flex items-center gap-3 rounded-r-lg bg-gradient-hero p-4 text-white hover:brightness-105 transition"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl" aria-hidden="true">
        ⭐
      </span>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-caption font-semibold opacity-90">Tus puntos</p>
        <p className="text-h1 font-extrabold" data-testid="points-balance">
          {loaded ? balance.toLocaleString('es') : '—'}
        </p>
        {next && (
          <p className="text-caption opacity-90 truncate" data-testid="points-next-reward">
            🎁 Próxima recompensa: {next.name} · {next.pointsCost} pts
          </p>
        )}
        {bonus.available && (
          <span className="inline-block rounded-full bg-white/25 px-2.5 py-0.5 text-caption font-bold" data-testid="points-bonus-pill">
            +{bonus.points} en tu primer pedido
          </span>
        )}
      </div>
    </Link>
  )
}
