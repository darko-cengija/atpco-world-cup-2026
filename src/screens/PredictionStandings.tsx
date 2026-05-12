import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/Avatar'
import { actualOutcome, applyPredictionScore } from '@/lib/predictions'
import type { PredictionStanding } from '@/types'

const compareNames = (a: string, b: string) =>
  a.localeCompare(b, 'en', { sensitivity: 'base' })

export default function PredictionStandings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [standings, setStandings] = useState<PredictionStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [playerCount, setPlayerCount] = useState(0)

  const usersRef = useRef<{ id: string; displayName: string; avatarUrl: string | null }[]>([])
  const gameStartedAtRef = useRef<Timestamp | null>(null)
  const predsCacheRef = useRef<Record<string, { userId: string; outcome: string }[]>>({})

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    async function init() {
      const [usersSnap, configSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('onboardingComplete', '==', true))),
        getDoc(doc(db, 'config', 'app')),
      ])

      usersRef.current = usersSnap.docs.map((d) => ({
        id: d.id,
        displayName: d.data().displayName as string,
        avatarUrl: (d.data().avatarUrl as string | null) ?? null,
      }))
      setPlayerCount(usersRef.current.length)
      gameStartedAtRef.current = (configSnap.data()?.gameStartedAt as Timestamp | undefined) ?? null

      // Real-time listener on finished matches only — predictions are evaluated
      // after the final whistle, not during play.
      const matchesQuery = query(
        collection(db, 'matches'),
        where('status', '==', 'finished'),
      )

      unsubscribe = onSnapshot(matchesQuery, async (matchesSnap) => {
        const gameStartedAt = gameStartedAtRef.current
        const allUserIds = usersRef.current.map((u) => u.id)

        const pointsMap: Record<string, number> = {}
        for (const uid of allUserIds) pointsMap[uid] = 0

        const eligibleMatchDocs = gameStartedAt
          ? matchesSnap.docs.filter((d) => {
              const dateField = d.data().date as Timestamp | undefined
              return dateField != null && dateField.toMillis() >= gameStartedAt.toMillis()
            })
          : []

        if (eligibleMatchDocs.length > 0) {
          const matchIds = eligibleMatchDocs.map((d) => d.id)

          // Only fetch predictions for matches not already in cache.
          const uncachedIds = matchIds.filter((id) => !(id in predsCacheRef.current))
          if (uncachedIds.length > 0) {
            for (let i = 0; i < uncachedIds.length; i += 30) {
              const chunk = uncachedIds.slice(i, i + 30)
              const predsSnap = await getDocs(
                query(collection(db, 'predictions'), where('matchId', 'in', chunk)),
              )
              for (const d of predsSnap.docs) {
                const matchId = d.data().matchId as string
                if (!predsCacheRef.current[matchId]) predsCacheRef.current[matchId] = []
                predsCacheRef.current[matchId].push({
                  userId: d.data().userId as string,
                  outcome: d.data().outcome as string,
                })
              }
            }
            // Mark fetched-but-empty matches so we don't re-fetch them.
            for (const id of uncachedIds) {
              if (!predsCacheRef.current[id]) predsCacheRef.current[id] = []
            }
          }

          const predsByMatch = predsCacheRef.current

          for (const matchDoc of eligibleMatchDocs) {
            const matchData = matchDoc.data()
            if (matchData.homeScore == null || matchData.awayScore == null) continue

            const actualOut = actualOutcome(
              matchData.homeScore as number,
              matchData.awayScore as number,
              matchData.qualifier ?? null,
            )

            const matchPreds = predsByMatch[matchDoc.id] ?? []
            applyPredictionScore(allUserIds, pointsMap, matchPreds, actualOut)
          }
        }

        const result: PredictionStanding[] = usersRef.current.map((u) => ({
          userId: u.id,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          points: Math.round(pointsMap[u.id] * 100) / 100,
        }))

        result.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          return compareNames(a.displayName, b.displayName)
        })
        setStandings(result)
        setLoading(false)
      })
    }

    init()
    return () => { unsubscribe?.() }
  }, [])

  return (
    <div className="px-4 py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Prediction Standings</h1>
        <p className="text-gray-400 text-sm mt-1">Prediction points</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : standings.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          No results yet. Predict outcomes to win points.
        </p>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2rem_1fr_3.5rem] px-4 py-2 border-b border-brand-border text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Points</span>
          </div>

          {standings.map((row, i) => {
            const isMe = row.userId === user?.uid
            return (
              <div
                key={row.userId}
                onClick={() => navigate(`/player/${row.userId}`)}
                className={`grid grid-cols-[2rem_1fr_3.5rem] px-4 py-3 border-b border-brand-border last:border-0 items-center cursor-pointer hover:bg-white/5 ${
                  isMe ? 'bg-brand-accent/5' : ''
                }`}
              >
                <span className="text-sm font-bold">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-500">{i + 1}</span>}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar url={row.avatarUrl} name={row.displayName} className="w-7 h-7" />
                  <span className={`text-sm font-semibold truncate ${isMe ? 'text-brand-accent' : 'text-white'}`}>
                    {row.displayName}
                    {isMe && <span className="text-xs ml-1 font-normal opacity-60">(you)</span>}
                  </span>
                </div>
                <span className={`text-right text-sm font-bold ${row.points < 0 ? 'text-red-400' : 'text-white'}`}>
                  {row.points.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!loading && playerCount > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-left text-xs text-gray-600">
          <li>
            A correct prediction earns {playerCount}/n points, where n is the number of players who got it right.
          </li>
          <li>If you do not predict, you lose 1/{playerCount} points.</li>
        </ul>
      )}
    </div>
  )
}
