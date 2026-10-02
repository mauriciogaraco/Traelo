import { useCallback, useEffect, useState } from 'react'
import { getMyReferralHistory, getMyReferralSummary, getReferralLeaderboard } from '../api/referrals'
import { ApiError } from '../api/ApiError'
import type { ReferralHistoryItem, ReferralLeaderboardEntry, ReferralSummary } from '../types/backend/referral'

/**
 * Datos de "Invita y gana": resumen (código/link/contadores), historial y leaderboard, en una
 * sola carga. Todo lo decide el backend (incluido `summary.enabled`): esta pantalla solo refleja
 * lo que llega, nunca calcula puntos ni estados por su cuenta.
 */
export function useReferrals(enabled: boolean) {
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [history, setHistory] = useState<ReferralHistoryItem[]>([])
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'offline' | 'error' | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const [summaryResult, historyResult, leaderboardResult] = await Promise.all([
        getMyReferralSummary(),
        getMyReferralHistory(),
        getReferralLeaderboard(),
      ])
      setSummary(summaryResult)
      setHistory(historyResult)
      setLeaderboard(leaderboardResult)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError && (err.isNetworkError() || err.isTimeout()) ? 'offline' : 'error')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    load()
  }, [load])

  return { summary, history, leaderboard, loading, error, reload: load }
}
