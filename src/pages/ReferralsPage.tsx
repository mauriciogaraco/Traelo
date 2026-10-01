import { AuthPrompt } from '../components/auth/AuthPrompt'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Icon } from '../components/ui/Icon'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { StatusBadge, type StatusTone } from '../components/ui/StatusBadge'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useReferrals } from '../hooks/useReferrals'
import type { ReferralStatus } from '../types/backend/referral'

const STATUS_LABEL: Record<ReferralStatus, string> = {
  REGISTERED: 'Esperando su primer pedido',
  QUALIFIED: '¡Referencia completada!',
  REWARDED: '¡Referencia completada!',
}

const STATUS_TONE: Record<ReferralStatus, StatusTone> = {
  REGISTERED: 'warning',
  QUALIFIED: 'success',
  REWARDED: 'success',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function shareMessage(link: string): string {
  return `¡Prueba Tráelo! 🛍️\n\nCompra lo que necesitas en negocios de tu comunidad y recíbelo donde estés.\n\nEntra aquí:\n${link}`
}

/** "Invita y gana" (checklist §6): código, link, contadores, historial y leaderboard. */
export function ReferralsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const { summary, history, leaderboard, loading, error, reload } = useReferrals(isAuthenticated)

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      showToast('✓ Enlace copiado', 'success')
    } catch {
      showToast('No pudimos copiar el enlace', 'error')
    }
  }

  async function handleShare(link: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tráelo', text: shareMessage(link), url: link })
        return
      } catch {
        // Cancelado por la persona, o el navegador lo rechazó: cae a copiar.
      }
    }
    await handleCopy(link)
  }

  if (authLoading) {
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
          title="Invita y gana puntos"
          description="Crea tu cuenta para conseguir tu código de invitación y ganar puntos cuando tus amigos hagan su primer pedido."
        />
      </div>
    )
  }

  if (loading && !summary) {
    return (
      <div className="px-4 lg:px-0 pt-6">
        <RowsSkeleton rows={4} />
      </div>
    )
  }

  if (error && !summary) {
    return <ErrorState description="No pudimos cargar tus referidos." onRetry={() => void reload()} />
  }

  if (summary && !summary.enabled) {
    return (
      <div className="px-4 lg:px-0 pt-6 max-w-2xl mx-auto">
        <EmptyState icon="gift" title="Invita y gana no está disponible por ahora" description="Vuelve a intentarlo más tarde." />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-0 pt-6 pb-10 space-y-5 max-w-2xl mx-auto">
      <div className="rounded-r-lg bg-gradient-hero p-6 text-center text-white shadow-card space-y-1">
        <span className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary">
          <Icon name="gift" size={30} filled />
        </span>
        <p className="text-h2">Invita a tus amigos</p>
        <p className="text-caption opacity-90">
          Comparte Tráelo y gana puntos cuando hagan su primer pedido.
        </p>
      </div>

      {summary?.code && summary.link && (
        <div className="rounded-r-lg bg-surface border border-border p-4 space-y-3">
          <div>
            <p className="text-caption text-text-secondary">Tu código</p>
            <p className="text-h1 tracking-wide text-primary-text" data-testid="referral-code">
              {summary.code}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-caption text-text-secondary">Tu enlace</p>
            <p className="truncate text-body font-semibold text-text-primary">{summary.link.replace(/^https?:\/\//, '')}</p>
          </div>
          <div className="flex gap-2">
            <Button fullWidth onClick={() => void handleShare(summary.link!)}>
              <Icon name="share" size={18} />
              Compartir
            </Button>
            <Button variant="outline" fullWidth onClick={() => void handleCopy(summary.link!)}>
              <Icon name="copy" size={18} />
              Copiar
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-r-lg bg-surface border border-border p-3 text-center">
          <p className="text-h2 text-text-primary">{summary?.totalReferred ?? 0}</p>
          <p className="text-caption text-text-secondary">{summary?.totalReferred === 1 ? 'persona' : 'personas'}</p>
        </div>
        <div className="rounded-r-lg bg-surface border border-border p-3 text-center">
          <p className="text-h2 text-text-primary">{summary?.completedReferred ?? 0}</p>
          <p className="text-caption text-text-secondary">completaron</p>
        </div>
        <div className="rounded-r-lg bg-surface border border-border p-3 text-center">
          <p className="text-h2 text-gold-text">+{summary?.pointsEarned ?? 0}</p>
          <p className="text-caption text-text-secondary">pts ganados</p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-h3 text-text-primary">Tus referidos</h2>
        {loading && history.length === 0 ? (
          <RowsSkeleton rows={2} />
        ) : history.length === 0 ? (
          <EmptyState
            icon="gift"
            title="Todavía no tienes referidos"
            description="Comparte tu enlace y empieza a ganar puntos."
          />
        ) : (
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-r-lg bg-surface border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary truncate">{item.referredName}</p>
                  <p className="text-caption text-text-secondary">{formatDate(item.createdAt)}</p>
                </div>
                <StatusBadge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {leaderboard.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-h3 text-text-primary">
            <Icon name="trophy" size={20} />
            Top referidores
          </h2>
          <ol className="space-y-1.5">
            {leaderboard.map((entry, index) => (
              <li
                key={`${entry.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-r-lg bg-surface border border-border/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-6 shrink-0 text-center font-bold text-text-tertiary">{index + 1}.</span>
                  <span className="truncate font-semibold text-text-primary">{entry.name}</span>
                </span>
                <span className="shrink-0 text-caption text-text-secondary">
                  {entry.completedReferrals} {entry.completedReferrals === 1 ? 'referido' : 'referidos'}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
