import type { PredictionOutcome } from '@/types'

export type PredictionQualifier = 'home' | 'away' | null

export interface PredictionVote {
  userId: string
  outcome: string
}

export function actualOutcome(
  home: number,
  away: number,
  qualifier: PredictionQualifier,
): PredictionOutcome {
  // qualifier is set for KO matches that went to ET/penalties and is authoritative.
  if (qualifier) return qualifier === 'home' ? 'X1' : 'X2'
  if (home > away) return '1'
  if (home < away) return '2'
  return 'X'
}

export function applyPredictionScore(
  userIds: string[],
  pointsByUserId: Record<string, number>,
  predictions: PredictionVote[],
  outcome: PredictionOutcome,
) {
  const playerCount = userIds.length
  const correctCount = predictions.filter((prediction) => prediction.outcome === outcome).length

  for (const userId of userIds) {
    if (correctCount > 0 && predictions.find((prediction) => prediction.userId === userId)?.outcome === outcome) {
      pointsByUserId[userId] += playerCount / correctCount
    }
  }
}
