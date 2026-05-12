import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

export interface ProjectedStandingRow {
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export interface ProjectedTeamStandingRow extends ProjectedStandingRow {
  teamId: string
}

interface WinningChanceRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  wins: number
  chancePercent: number
  expectedPoints?: number
  projectedStanding?: ProjectedStandingRow
  projectedTeams?: ProjectedTeamStandingRow[]
}

export function useWinningChances() {
  const [chances, setChances] = useState<WinningChanceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(doc(db, 'stats', 'winningChances'), (snapshot) => {
      const rows = snapshot.data()?.rows
      setChances(Array.isArray(rows) ? rows as WinningChanceRow[] : [])
      setLoading(false)
    }, () => {
      setChances([])
      setLoading(false)
    })
  }, [])

  return { chances, loading }
}
