import { formatCup } from '../catalog/Price'
import { formatPoints } from '../../features/rewards'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import type { Reward } from '../../types/backend/rewards'

type Props = {
  open: boolean
  /** Solo las recompensas que el servidor marcó como alcanzables y cuyo producto está en el carrito. */
  rewards: Reward[]
  balance: number | null
  /** Id de la recompensa que se está cotizando (bloquea el resto mientras el servidor responde). */
  busyRewardId: string | null
  onSelect: (reward: Reward) => void
  onClose: () => void
}

/** "Tus recompensas" (`RewardSheet` de mobile): cada una con su costo en puntos y el precio normal. Elegir NO descuenta nada. */
export function RewardSheet({ open, rewards, balance, busyRewardId, onSelect, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Tus recompensas">
      <div className="space-y-4">
        {balance !== null && <p className="text-caption text-text-secondary">Tienes {formatPoints(balance)}</p>}
        <ul className="space-y-3">
          {rewards.map((reward) => (
            <li key={reward.id} data-testid={`reward-option-${reward.id}`} className="rounded-r-lg bg-surface border border-border/60 p-3 space-y-2">
              <div>
                <p className="font-semibold text-text-primary">🎁 {reward.name}</p>
                <p className="text-caption text-text-secondary">
                  {formatPoints(reward.pointsCost)}
                  {reward.moneyValue !== null ? ` · Precio normal: ${formatCup(reward.moneyValue)}` : ''}
                </p>
              </div>
              <Button
                fullWidth
                size="sm"
                loading={busyRewardId === reward.id}
                disabled={busyRewardId !== null && busyRewardId !== reward.id}
                onClick={() => onSelect(reward)}
              >
                Usar {reward.pointsCost.toLocaleString('es')} puntos
              </Button>
            </li>
          ))}
        </ul>
        <Button fullWidth variant="outline" onClick={onClose}>
          Ahora no
        </Button>
      </div>
    </Sheet>
  )
}
