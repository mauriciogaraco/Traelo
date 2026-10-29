/** DTOs del sistema de referidos V1 — ver backend src/modules/referrals. */

/** Insignia del perfil: oro (embajador) o diamante (embajador especial). */
export type AmbassadorTier = 'AMBASSADOR' | 'SPECIAL'

export type ReferralSummary = {
  /** false = el programa está apagado globalmente; el resto de los campos vienen vacíos. */
  enabled: boolean
  code: string | null
  link: string | null
  totalReferred: number
  completedReferred: number
  pointsEarned: number
  /** Insignia de embajador (null/ausente = no es embajador). */
  ambassadorTier?: AmbassadorTier | null
}

export type ReferralStatus = 'REGISTERED' | 'QUALIFIED' | 'REWARDED'

export type ReferralHistoryItem = {
  id: string
  referredName: string
  status: ReferralStatus
  createdAt: string
  rewardedAt: string | null
}

export type ReferralLeaderboardEntry = {
  name: string
  completedReferrals: number
}

export type AttributeReferralOutcome =
  | 'ATTRIBUTED'
  | 'SELF_REFERRAL'
  | 'ALREADY_REFERRED'
  | 'INVALID_CODE'
  | 'DISABLED'
