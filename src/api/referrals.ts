import { apiGet, apiPost } from './client';
import type {
  AttributeReferralOutcome,
  ReferralHistoryItem,
  ReferralLeaderboardEntry,
  ReferralSummary,
} from '../types/backend/referral';

/** Código, link y contadores del cliente autenticado (requiere sesión). */
export function getMyReferralSummary() {
  return apiGet<ReferralSummary>('/customers/me/referrals', undefined, { auth: true });
}

export function getMyReferralHistory() {
  return apiGet<ReferralHistoryItem[]>('/customers/me/referrals/history', undefined, { auth: true });
}

/** Top referidores del mes — público, no requiere sesión. */
export function getReferralLeaderboard(limit = 20) {
  return apiGet<ReferralLeaderboardEntry[]>('/referrals/leaderboard', { limit });
}

/** Atribuye al cliente autenticado al dueño de `code` (ver checklist §10: abrir un link ya logueado). */
export function attributeReferral(code: string) {
  return apiPost<{ outcome: AttributeReferralOutcome }>('/referrals/attribute', { code }, { auth: true });
}
