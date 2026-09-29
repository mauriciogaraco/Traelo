import { formatCup } from '../catalog/Price'
import { formatPoints, nextReward } from '../../features/rewards'
import { useRewardsStore } from '../../store/rewardsStore'
import type { Reward } from '../../types/backend/rewards'

function statusText(reward: Reward): string {
  if (reward.status === 'AVAILABLE') return 'Tienes suficientes puntos'
  if (reward.status === 'INSUFFICIENT_POINTS') return `Te faltan ${formatPoints(reward.missingPoints)}`
  return 'Inicia sesión para usar tus puntos'
}

/** Porción de la meta que ya se tiene, sacada de lo que el servidor dice que falta (solo para la barra). */
function progressOf(reward: Reward): number {
  if (reward.status === 'AVAILABLE') return 1
  return Math.max(0, Math.min(1, (reward.pointsCost - reward.missingPoints) / reward.pointsCost))
}

/**
 * "Próxima recompensa" y la lista de recompensas, en la pantalla de puntos (`RewardsPanel` de
 * mobile). El canje no se hace aquí: se decide en el carrito, cuando la persona ya está comprando.
 */
export function RewardsPanel() {
  const loaded = useRewardsStore((state) => state.loaded)
  const rewards = useRewardsStore((state) => state.rewards)
  if (!loaded || rewards.length === 0) return null

  const next = nextReward(rewards)

  return (
    <div className="space-y-3" data-testid="rewards-panel">
      {next && (
        <div className="rounded-r-lg bg-gold-soft p-4 space-y-1.5" data-testid="next-reward">
          <p className="text-caption font-semibold text-gold-text">Próxima recompensa</p>
          <p className="text-h3 text-text-primary">🎁 {next.name}</p>
          <p className="text-body text-text-primary">{formatPoints(next.pointsCost)}</p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressOf(next) * 100)}
            className="h-2 rounded-full bg-gold/20 overflow-hidden my-1"
          >
            <div className="h-2 rounded-full bg-gold" style={{ width: `${Math.round(progressOf(next) * 100)}%` }} />
          </div>
          <p className="text-caption font-semibold text-gold-text">{statusText(next)}</p>
        </div>
      )}

      <h2 className="text-h3 text-text-primary">Recompensas</h2>
      <ul className="space-y-2">
        {rewards.map((reward) => (
          <li
            key={reward.id}
            data-testid={`reward-row-${reward.id}`}
            className="flex items-center gap-3 rounded-r-lg bg-surface border border-border/60 p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary">{reward.name}</p>
              <p className="text-caption text-text-secondary">
                {formatPoints(reward.pointsCost)}
                {reward.moneyValue !== null ? ` · Precio normal: ${formatCup(reward.moneyValue)}` : ''}
              </p>
            </div>
            <span className={`text-caption text-right ${reward.status === 'AVAILABLE' ? 'font-bold text-success-text' : 'text-text-secondary'}`}>
              {statusText(reward)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-secondary">Agrega el producto a tu pedido y usa tus puntos desde el carrito.</p>
    </div>
  )
}
