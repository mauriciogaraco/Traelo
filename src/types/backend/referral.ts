/** DTOs del sistema de referidos V1 — ver backend src/modules/referrals. */

export type ReferralSummary = {
  /** false = el programa está apagado globalmente; el resto de los campos vienen vacíos. */
  enabled: boolean
  code: string | null
  link: string | null
  totalReferred: number
  completedReferred: number
  pointsEarned: number
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
