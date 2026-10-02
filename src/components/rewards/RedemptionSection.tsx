import { useMemo, useState } from 'react'
import { availableRewards, formatPoints, nextReward, rewardsInCart, validApplied } from '../../features/rewards'
import { useAuth } from '../../hooks/useAuth'
import { clearRedemption, confirmRedemption, requestRedemptionQuote } from '../../services/rewardsService'
import { useRewardsStore } from '../../store/rewardsStore'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { RedemptionConfirm } from './RedemptionConfirm'
import { RewardSheet } from './RewardSheet'
import type { CartItem } from '../../store/cartStore'
import type { OrderQuote, Reward } from '../../types/backend/rewards'

type Props = { items: CartItem[] }

/**
 * "🎁 Usa tus puntos" en el carrito (`RedemptionSection` de mobile). Solo muestra lo que el
 * SERVIDOR dijo (qué alcanza, cuánto falta); elegir una recompensa pide una cotización al
 * servidor y confirma con el desglose. Nada se descuenta aquí: los puntos se descuentan al crear
 * el pedido, junto con él.
 */
export function RedemptionSection({ items }: Props) {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const loaded = useRewardsStore((state) => state.loaded)
  const rewards = useRewardsStore((state) => state.rewards)
  const balance = useRewardsStore((state) => state.balance)
  const appliedRaw = useRewardsStore((state) => state.applied)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [busyRewardId, setBusyRewardId] = useState<string | null>(null)
  const [pending, setPending] = useState<{ reward: Reward; quote: OrderQuote } | null>(null)

  const applied = useMemo(() => validApplied(appliedRaw, items), [items, appliedRaw])
  const inCart = useMemo(() => rewardsInCart(rewards, items), [rewards, items])
  const available = useMemo(() => availableRewards(inCart), [inCart])

  if (!loaded || rewards.length === 0) return null

  const handleSelect = async (reward: Reward) => {
    setBusyRewardId(reward.id)
    const result = await requestRedemptionQuote(items, reward)
    setBusyRewardId(null)
    if (result.ok) {
      setSheetOpen(false)
      setPending({ reward, quote: result.quote })
    } else {
      setSheetOpen(false)
      showToast(`No pudimos aplicar el canje. ${result.message}`, 'error')
    }
  }

  const handleConfirm = () => {
    if (!pending) return
    confirmRedemption(items, pending.reward, pending.quote)
    setPending(null)
    showToast('Canje listo. Tus puntos se descuentan cuando confirmes el pedido.', 'success')
  }

  // Canje ya elegido: resumen con lo que dijo el servidor y opción de quitarlo.
  if (applied?.quote.redemption) {
    const redemption = applied.quote.redemption
    return (
      <div className="rounded-r-lg bg-gold-soft border border-gold p-4 space-y-1" data-testid="redemption-applied">
        <p className="font-semibold text-gold-text">🎁 {redemption.rewardName} canjeada</p>
        <p className="text-body text-text-primary" data-testid="redemption-applied-points">
          −{formatPoints(redemption.pointsCost)}
        </p>
        <p className="text-caption text-warning-text" data-testid="redemption-applied-remaining">
          Puntos restantes: {redemption.balanceAfter.toLocaleString('es')}
        </p>
        <Button variant="outline" size="sm" onClick={clearRedemption}>
          Quitar canje
        </Button>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (inCart.length === 0) return null
    const reward = inCart[0]!
    return (
      <div className="rounded-r-lg bg-gold-soft p-4 space-y-1" data-testid="redemption-guest">
        <p className="font-semibold text-gold-text">
          🎁 {reward.name} se canjea por {formatPoints(reward.pointsCost)}
        </p>
        <p className="text-caption text-warning-text">Crea tu cuenta, gana puntos con tus pedidos y úsalos aquí.</p>
      </div>
    )
  }

  if (available.length > 0) {
    return (
      <>
        <div className="rounded-r-lg bg-gold-soft p-4 space-y-2" data-testid="redemption-offer">
          <p className="font-semibold text-gold-text">🎁 Usa tus puntos</p>
          <p className="text-body text-text-primary">
            Tienes <span className="font-semibold">{formatPoints(balance ?? 0)}</span>
          </p>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            Usar puntos
          </Button>
        </div>
        <RewardSheet
          open={sheetOpen}
          rewards={available}
          balance={balance}
          busyRewardId={busyRewardId}
          onSelect={(reward) => void handleSelect(reward)}
          onClose={() => setSheetOpen(false)}
        />
        <RedemptionConfirm open={pending !== null} quote={pending?.quote ?? null} onConfirm={handleConfirm} onCancel={() => setPending(null)} />
      </>
    )
  }

  // Hay una recompensa de un producto del carrito pero no alcanzan los puntos: motivación, no frustración.
  const nearInCart = inCart.filter((reward) => reward.status === 'INSUFFICIENT_POINTS').sort((a, b) => a.missingPoints - b.missingPoints)[0]
  if (nearInCart) {
    return (
      <div className="rounded-r-lg bg-gold-soft p-4 space-y-1" data-testid="redemption-missing">
        <p className="font-semibold text-gold-text">
          🎁 {nearInCart.name} se canjea por {formatPoints(nearInCart.pointsCost)}
        </p>
        <p className="text-caption text-warning-text">
          Tienes {formatPoints(balance ?? 0)} · Te faltan {formatPoints(nearInCart.missingPoints)}
        </p>
      </div>
    )
  }

  // Sin recompensa en el carrito: solo un empujón discreto hacia la próxima meta.
  const next = nextReward(rewards)
  if (next && next.status === 'INSUFFICIENT_POINTS') {
    return (
      <p className="text-center text-caption text-text-secondary" data-testid="redemption-next">
        Te faltan {formatPoints(next.missingPoints)} para tu próxima recompensa ({next.name}).
      </p>
    )
  }
  return null
}
