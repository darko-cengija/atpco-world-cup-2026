import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { collection, getDocs, query, where, doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { getCountryName, getStageName } from '@/lib/translations'
import type { AppUser, Match, PredictionOutcome } from '@/types'
import { TicketSpinner } from '@/components/TicketMark'

interface PredictionEntry {
  userId: string
  outcome: PredictionOutcome
}

interface FinishedMatch {
  match: Match
  actualOutcome: PredictionOutcome
  predictions: PredictionEntry[]
}

function computeOutcome(
  home: number,
  away: number,
  stage: string,
  qualifier: 'home' | 'away' | null,
): PredictionOutcome {
  if (home > away) return '1'
  if (home < away) return '2'
  if (!stage.toLowerCase().includes('group') && qualifier) {
    return qualifier === 'home' ? 'X1' : 'X2'
  }
  return 'X'
}

export default function FinishedMatches() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rows, setRows] = useState<FinishedMatch[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    async function load() {
      // Fetch everything in parallel
      const [usersSnap, matchesSnap, teamsSnap, configSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('onboardingComplete', '==', true))),
        getDocs(query(collection(db, 'matches'), where('status', '==', 'finished'))),
        getDocs(collection(db, 'teams')),
        getDoc(doc(db, 'config', 'app')),
      ])

      const gameStartedAt = (configSnap.data()?.gameStartedAt as Timestamp | undefined) ?? null

      const allUsers: AppUser[] = usersSnap.docs.map(
        (d) => ({ uid: d.id, ...d.data() } as AppUser),
      )
      setUsers(allUsers)

      // Build a team lookup map by id
      const teamMap: Record<string, { id: string; name: string; flag: string; group: string }> = {}
      for (const d of teamsSnap.docs) {
        teamMap[d.id] = { id: d.id, ...d.data() } as { id: string; name: string; flag: string; group: string }
      }

      // Only show matches played after the game was officially started.
      const eligibleDocs = gameStartedAt
        ? matchesSnap.docs.filter((d) => {
            const dateField = d.data().date as Timestamp | undefined
            return dateField != null && dateField.toMillis() >= gameStartedAt.toMillis()
          })
        : []

      if (eligibleDocs.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      // All predictions for eligible finished matches (one bulk query)
      const finishedMatchIds = eligibleDocs.map((d) => d.id)
      // Firestore 'in' supports up to 30 items; chunk if needed
      const predictionMap: Record<string, PredictionEntry[]> = {}
      const chunks: string[][] = []
      for (let i = 0; i < finishedMatchIds.length; i += 30) {
        chunks.push(finishedMatchIds.slice(i, i + 30))
      }
      for (const chunk of chunks) {
        const predsSnap = await getDocs(
          query(collection(db, 'predictions'), where('matchId', 'in', chunk)),
        )
        for (const d of predsSnap.docs) {
          const data = d.data()
          if (!predictionMap[data.matchId]) predictionMap[data.matchId] = []
          predictionMap[data.matchId].push({
            userId: data.userId,
            outcome: data.outcome as PredictionOutcome,
          })
        }
      }

      // Build rows, sorted by date descending (most recent first)
      const result: FinishedMatch[] = eligibleDocs
        .map((d) => {
          const data = d.data()

          // Resolve team objects from the embedded data (we need to fetch teams)
          return {
            _raw: d,
            date: data.date.toDate() as Date,
            homeScore: data.homeScore as number,
            awayScore: data.awayScore as number,
            stage: (data.stage ?? 'Group Stage') as string,
            qualifier: (data.qualifier ?? null) as 'home' | 'away' | null,
            minute: null,
            stoppageTime: null,
            statusShort: null,
          }
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(({ _raw, date, homeScore, awayScore, stage, qualifier }) => {
          const data = _raw.data()
          const fallback = (id: string) => ({ id, name: id, flag: '🏳️', group: '' })
          const match: Match = {
            id: _raw.id,
            homeTeamId: data.homeTeamId,
            awayTeamId: data.awayTeamId,
            homeTeam: teamMap[data.homeTeamId] ?? fallback(data.homeTeamId),
            awayTeam: teamMap[data.awayTeamId] ?? fallback(data.awayTeamId),
            date,
            venue: data.venue,
            stage,
            status: 'finished',
            homeScore,
            awayScore,
            qualifier,
            minute: null,
            stoppageTime: null,
            statusShort: null,
          }
          return {
            match,
            actualOutcome: computeOutcome(homeScore, awayScore, stage, qualifier),
            predictions: predictionMap[_raw.id] ?? [],
          }
        })

      setRows(result)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <TicketSpinner label="Loading archive" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-brand-border text-brand-ink hover:border-brand-ink transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="ticket-meta">Stubs · Archive</p>
          <h1 className="font-display text-xl leading-none text-brand-ink">Finished Matches</h1>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="mx-4 rounded-xl border border-dashed border-brand-border py-20 text-center text-brand-faint">No finished matches.</p>
      )}

      <div className="px-4 pb-8 space-y-4">
        {rows.map(({ match, actualOutcome, predictions }) => (
            <div
              key={match.id}
              className="ticket-card"
            >
              {/* Stage + date */}
              <div className="flex items-center justify-between border-b border-dashed border-brand-border px-4 py-3 text-xs">
                <span className="ticket-meta text-brand-stamp">★ {getStageName(match.stage)}</span>
                <span className="font-mono tabular-nums text-brand-faint">
                  {match.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Teams + score */}
              <div className="flex items-center justify-between px-4 py-3">
                <TeamCell flag={match.homeTeam.flag} name={getCountryName(match.homeTeam.name)} align="left" />
                <div className="flex flex-col items-center px-3">
                  <span className="font-display text-3xl leading-none text-brand-ink tabular-nums">
                    {match.homeScore}:{match.awayScore}
                  </span>
                  <span className="ticket-stamp mt-1 !py-1 !text-xs">
                    {actualOutcome}
                  </span>
                </div>
                <TeamCell flag={match.awayTeam.flag} name={getCountryName(match.awayTeam.name)} align="right" />
              </div>

              {/* Player predictions */}
              {predictions.length > 0 && (
                <div className="border-t border-dashed border-brand-border px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {users.map((u) => {
                      const pred = predictions.find((p) => p.userId === u.uid)
                      const isMe = u.uid === user?.uid
                      const displayName = isMe ? user?.displayName ?? u.displayName : u.displayName
                      const avatarUrl = isMe ? user?.avatarUrl ?? u.avatarUrl : u.avatarUrl
                      const correct = pred?.outcome === actualOutcome

                      return (
                        <div
                          key={u.uid}
                          className={`flex items-center gap-1.5 rounded-md px-2 py-1 border text-xs ${
                            !pred
                              ? 'border-brand-border text-brand-faint'
                              : correct
                              ? 'border-emerald-700 bg-emerald-700/10 text-emerald-700'
                              : 'border-brand-stamp/60 bg-brand-stamp/10 text-brand-stamp'
                          }`}
                        >
                          <AvatarTiny url={avatarUrl} name={displayName} />
                          <span className={isMe ? 'font-bold' : ''}>
                            {displayName.split(' ')[0]}
                          </span>
                          {pred ? (
                            <>
                              <span className="font-bold">{pred.outcome}</span>
                              {correct ? (
                                <Check size={11} className="text-emerald-400" />
                              ) : (
                                <X size={11} className="text-red-400" />
                              )}
                            </>
                          ) : (
                            <span className="italic">–</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
        ))}
      </div>
    </div>
  )
}

function TeamCell({ flag, name, align }: { flag: string; name: string; align: 'left' | 'right' }) {
  const textAlign = align === 'right' ? 'text-right' : 'text-left'

  return (
    <div className={`flex-1 flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="text-3xl">{flag}</span>
      <span className={`max-w-full font-display text-sm leading-tight text-brand-ink mt-0.5 ${textAlign}`}>{name}</span>
    </div>
  )
}

function AvatarTiny({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-4 h-4 rounded-full bg-brand-ink text-brand-ticket flex items-center justify-center overflow-hidden shrink-0">
      {url?.startsWith('emoji:') ? (
        <span className="text-[9px] leading-none">{url.replace('emoji:', '')}</span>
      ) : url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[8px] font-bold text-brand-ticket">{name[0]?.toUpperCase()}</span>
      )}
    </div>
  )
}
