import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  documentId,
  getDocs,
  getDocsFromServer,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Match, Team } from '@/types'

const MIN_FOREGROUND_REFRESH_MS = 3000
const FIRESTORE_IN_QUERY_LIMIT = 30

export function useUpcomingMatches(count = 4) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadVersionRef = useRef(0)
  const lastForegroundRefreshAtRef = useRef(0)
  const teamCacheRef = useRef<Record<string, Team>>({})
  const teamPreloadRef = useRef<Promise<void> | null>(null)

  const preloadTeams = useCallback(() => {
    if (!teamPreloadRef.current) {
      teamPreloadRef.current = getDocs(collection(db, 'teams'))
        .then((snap) => {
          for (const teamDoc of snap.docs) {
            teamCacheRef.current[teamDoc.id] = { id: teamDoc.id, ...teamDoc.data() } as Team
          }
        })
        .catch((err) => {
          teamPreloadRef.current = null
          throw err
        })
    }

    return teamPreloadRef.current
  }, [])

  const fetchTeamsByIds = useCallback(async (teamIds: string[]) => {
    const uniqueIds = [...new Set(teamIds)]
    const idsToLoad = uniqueIds.filter((teamId) => !teamCacheRef.current[teamId])

    await Promise.all(
      chunk(idsToLoad, FIRESTORE_IN_QUERY_LIMIT).map(async (ids) => {
        const snap = await getDocs(query(
          collection(db, 'teams'),
          where(documentId(), 'in', ids),
        ))

        for (const teamDoc of snap.docs) {
          teamCacheRef.current[teamDoc.id] = { id: teamDoc.id, ...teamDoc.data() } as Team
        }
      }),
    )

    return teamCacheRef.current
  }, [])

  const buildMatchesFromSnapshot = useCallback(async (snap: QuerySnapshot<DocumentData>) => {
    try {
      await preloadTeams()
    } catch (err) {
      console.warn('Failed to preload teams before fixtures; falling back to fixture team lookup.', err)
    }

    const teamsById = await fetchTeamsByIds(
      snap.docs.flatMap((docSnap) => {
        const data = docSnap.data()
        return [data.homeTeamId as string, data.awayTeamId as string]
      }),
    )
    const results: Match[] = []

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      const homeTeam = teamsById[data.homeTeamId]
      const awayTeam = teamsById[data.awayTeamId]

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
        stoppageTime: data.stoppageTime ?? null,
        statusShort: data.statusShort ?? null,
      })
    }

    return results
  }, [fetchTeamsByIds, preloadTeams])

  const applyMatchesFromSnapshot = useCallback(async (snap: QuerySnapshot<DocumentData>) => {
    const currentVersion = ++loadVersionRef.current
    const results = await buildMatchesFromSnapshot(snap)
    if (currentVersion !== loadVersionRef.current) return

    setMatches(results)
    setError(null)
    setLoading(false)
  }, [buildMatchesFromSnapshot])

  useEffect(() => {
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['upcoming', 'live']),
      orderBy('date', 'asc'),
      limit(count),
    )
    let disposed = false

    void preloadTeams().catch(() => undefined)

    const refreshFromServer = async () => {
      try {
        const snap = await getDocsFromServer(q)
        if (disposed) return
        await applyMatchesFromSnapshot(snap)
      } catch (err) {
        if (disposed) return
        console.error('Failed to refresh upcoming matches from server.', err)
        setError('Upcoming matches could not be loaded.')
        setLoading(false)
      }
    }

    const refreshOnForeground = () => {
      if (document.visibilityState !== 'visible') return

      const now = Date.now()
      if (now - lastForegroundRefreshAtRef.current < MIN_FOREGROUND_REFRESH_MS) return
      lastForegroundRefreshAtRef.current = now

      void refreshFromServer()
    }

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        try {
          await applyMatchesFromSnapshot(snap)
        } catch (err) {
          console.error('Failed to load upcoming matches.', err)
          setError('Upcoming matches could not be loaded.')
          setLoading(false)
        }
      },
      (err) => {
        console.error('Upcoming matches listener failed.', err)
        setError('Upcoming matches could not be loaded.')
        setLoading(false)
      },
    )

    document.addEventListener('visibilitychange', refreshOnForeground)
    window.addEventListener('focus', refreshOnForeground)

    return () => {
      disposed = true
      loadVersionRef.current += 1
      unsubscribe()
      document.removeEventListener('visibilitychange', refreshOnForeground)
      window.removeEventListener('focus', refreshOnForeground)
    }
  }, [applyMatchesFromSnapshot, count, preloadTeams])

  return { matches, loading, error }
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
