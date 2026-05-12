import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Match, Team } from '@/types'

export function useUpcomingMatches(count = 4) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['upcoming', 'live']),
      orderBy('date', 'asc'),
      limit(count),
    )

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        try {
          const results: Match[] = []

          for (const docSnap of snap.docs) {
            const data = docSnap.data()

            const [homeTeam, awayTeam] = await Promise.all([
              fetchTeam(data.homeTeamId),
              fetchTeam(data.awayTeamId),
            ])

            if (!homeTeam || !awayTeam) continue

            results.push({
              id: docSnap.id,
              homeTeamId: data.homeTeamId,
              awayTeamId: data.awayTeamId,
              homeTeam,
              awayTeam,
              date: data.date.toDate(),
              venue: data.venue,
              stage: data.stage ?? 'Group Stage',
              status: data.status,
              homeScore: data.homeScore ?? null,
              awayScore: data.awayScore ?? null,
              qualifier: data.qualifier ?? null,
              minute: data.minute ?? null,
              statusShort: data.statusShort ?? null,
            })
          }

          setMatches(results)
          setError(null)
        } catch (err) {
          console.error('Failed to load upcoming matches.', err)
          setError('Upcoming matches could not be loaded.')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('Upcoming matches listener failed.', err)
        setError('Upcoming matches could not be loaded.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [count])

  return { matches, loading, error }
}

async function fetchTeam(teamId: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, 'teams', teamId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Team
}
