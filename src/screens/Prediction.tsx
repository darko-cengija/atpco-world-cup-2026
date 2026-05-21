import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/Avatar'
import { getCountryName } from '@/lib/translations'
import { PREDICTION_MATCH_WINDOW } from '@/lib/config'
import type { Match, Prediction, AppUser, PredictionOutcome } from '@/types'
import { TicketSpinner } from '@/components/TicketMark'

const SAVE_TIMEOUT_MS = 15000

function predictionWindowQuery() {
  return query(
    collection(db, 'matches'),
    where('status', 'in', ['upcoming', 'live']),
    orderBy('date', 'asc'),
    limit(PREDICTION_MATCH_WINDOW),
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms)
  })

  return Promise.race([
    promise.finally(() => {
      if (timeoutId) clearTimeout(timeoutId)
    }),
    timeout,
  ])
}

async function findNextUnpredictedMatch(currentMatchId: string, userId: string): Promise<string | null> {
  const [matchSnap, predSnap] = await Promise.all([
    getDocs(predictionWindowQuery()),
    getDocs(query(collection(db, 'predictions'), where('userId', '==', userId))),
  ])

  const now = Date.now()
  const orderedMatchIds = matchSnap.docs
    .filter((d) => {
      const data = d.data()
      return data.status === 'upcoming' && data.date.toDate().getTime() > now
    })
    .map((d) => d.id)
  const predicted = new Set(predSnap.docs.map(d => d.data().matchId))
  predicted.add(currentMatchId)

  const currentIndex = orderedMatchIds.indexOf(currentMatchId)
  if (currentIndex === -1) {
    return orderedMatchIds.find((id) => !predicted.has(id)) ?? null
  }

  for (let i = currentIndex + 1; i < orderedMatchIds.length; i += 1) {
    if (!predicted.has(orderedMatchIds[i])) return orderedMatchIds[i]
  }

  for (let i = 0; i < currentIndex; i += 1) {
    if (!predicted.has(orderedMatchIds[i])) return orderedMatchIds[i]
  }

  return null
}

async function buildMatchFromData(matchId: string, data: DocumentData): Promise<Match | null> {
  const [homeSnap, awaySnap] = await Promise.all([
    getDoc(doc(db, 'teams', data.homeTeamId)),
    getDoc(doc(db, 'teams', data.awayTeamId)),
  ])

  if (!homeSnap.exists() || !awaySnap.exists()) return null

  return {
    id: matchId,
    homeTeamId: data.homeTeamId,
    awayTeamId: data.awayTeamId,
    homeTeam: { id: homeSnap.id, ...homeSnap.data() } as Match['homeTeam'],
    awayTeam: { id: awaySnap.id, ...awaySnap.data() } as Match['awayTeam'],
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
  }
}

function isKnockout(stage: string): boolean {
  const s = stage.toLowerCase()
  return !s.includes('group') && !s.includes('regular season') && !s.includes('league phase')
}

interface PredictionWithUser extends Prediction {
  displayName: string
  avatarUrl: string | null
}

export default function Prediction() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<PredictionOutcome | null>(null)
  const [allPredictions, setAllPredictions] = useState<PredictionWithUser[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [predictionWindowLoading, setPredictionWindowLoading] = useState(true)
  const [isInPredictionWindow, setIsInPredictionWindow] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [, forceTick] = useState(0)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current) }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (!matchId) return

    setPredictionWindowLoading(true)
    const unsubscribe = onSnapshot(
      predictionWindowQuery(),
      (snap) => {
        setIsInPredictionWindow(snap.docs.some((docSnap) => docSnap.id === matchId))
        setPredictionWindowLoading(false)
      },
      (err) => {
        console.error('Prediction window listener failed.', err)
        setIsInPredictionWindow(false)
        setPredictionWindowLoading(false)
      },
    )

    return unsubscribe
  }, [matchId])

  useEffect(() => {
    if (!match) return
    if (match.status !== 'upcoming') return
    if (match.date.getTime() <= Date.now()) return

    const intervalId = setInterval(() => forceTick(n => n + 1), 1000)
    const onVisible = () => forceTick(n => n + 1)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [match])

  useEffect(() => {
    if (!matchId) return

    let snapshotVersion = 0
    setLoading(true)

    const unsubscribe = onSnapshot(
      doc(db, 'matches', matchId),
      async (snap) => {
        const currentVersion = ++snapshotVersion
        if (!snap.exists()) {
          setMatch(null)
          setLoading(false)
          return
        }

        const nextMatch = await buildMatchFromData(snap.id, snap.data())
        if (currentVersion !== snapshotVersion) return
        setMatch(nextMatch)
        setLoading(false)
      },
      () => {
        setMatch(null)
        setLoading(false)
      },
    )

    return () => {
      snapshotVersion += 1
      unsubscribe()
    }
  }, [matchId])

  // Load all predictions for this match
  useEffect(() => {
    if (!matchId) return

    const q = query(collection(db, 'predictions'), where('matchId', '==', matchId))
    const unsubscribe = onSnapshot(q, async (snap) => {
      const results: PredictionWithUser[] = []
      for (const docSnap of snap.docs) {
        const data = docSnap.data()
        const userSnap = await getDoc(doc(db, 'users', data.userId))
        const userData = userSnap.data() as AppUser | undefined

        results.push({
          id: docSnap.id,
          matchId: data.matchId,
          userId: data.userId,
          outcome: data.outcome,
          submittedAt: data.submittedAt?.toDate() ?? new Date(),
          displayName: userData?.displayName ?? 'Unknown',
          avatarUrl: userData?.avatarUrl ?? null,
        })
      }

      // Pre-fill if current user already has a prediction
      const mine = results.find((p) => p.userId === user?.uid)
      if (mine) setSelectedOutcome(mine.outcome)

      setAllPredictions(results)
    })

    return unsubscribe
  }, [matchId, user?.uid])

  async function handleSubmit() {
    if (!matchId || !user || !selectedOutcome) return
    if (!match || match.status !== 'upcoming' || match.date.getTime() <= Date.now()) return
    if (predictionWindowLoading || !isInPredictionWindow) return

    setSaving(true)
    setSaveError(null)
    const predId = `${matchId}_${user.uid}`

    try {
      await withTimeout(
        setDoc(doc(db, 'predictions', predId), {
          matchId,
          userId: user.uid,
          outcome: selectedOutcome,
          submittedAt: serverTimestamp(),
        }),
        SAVE_TIMEOUT_MS,
        'Prediction save timed out.',
      )
    } catch (err) {
      console.error('Failed to save prediction.', err)
      setSaveError('Prediction could not be saved. Please try again.')
      return
    } finally {
      setSaving(false)
    }

    setNavigating(true)

    let nextId: string | null = null
    try {
      nextId = await findNextUnpredictedMatch(matchId, user.uid)
    } catch (err) {
      console.error('Failed to find next prediction match.', err)
    }

    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    navTimerRef.current = setTimeout(() => {
      if (nextId) {
        navigate(`/match/${nextId}`, { replace: true })
      } else {
        navigate('/')
      }
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <TicketSpinner label="Loading match" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-muted">
        Match not found.
      </div>
    )
  }

  const now = Date.now()
  const matchClosed = match.status !== 'upcoming' || match.date.getTime() <= now
  const canEditPrediction = !matchClosed && !predictionWindowLoading && isInPredictionWindow
  const knockout = isKnockout(match.stage)
  const outcomes: PredictionOutcome[] = knockout ? ['1', 'X1', 'X2', '2'] : ['1', 'X', '2']

  const savedOutcome = allPredictions.find(p => p.userId === user?.uid)?.outcome ?? null
  const isSaved = selectedOutcome !== null && selectedOutcome === savedOutcome
  const isDirty = selectedOutcome !== null && selectedOutcome !== savedOutcome
  const lockMessage = predictionWindowLoading
    ? 'Checking prediction window...'
    : !isInPredictionWindow && !matchClosed
      ? 'Predictions open when this match reaches the Home screen.'
      : 'No prediction · Locked'
  const showPredictionsList = allPredictions.length > 0 && (canEditPrediction || matchClosed)

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="grid h-9 w-9 place-items-center rounded-lg border border-brand-border text-brand-ink transition-colors hover:border-brand-ink">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="ticket-meta">Match ticket</p>
          <h1 className="font-display text-xl leading-none text-brand-ink">Prediction</h1>
        </div>
        {!canEditPrediction && <Lock size={16} className="text-brand-gold ml-auto" />}
      </div>

      <div className="px-4 space-y-6">
        {/* Match card */}
        <div className="ticket-card">
          <div className="border-b border-dashed border-brand-border px-4 py-3 text-center">
            <p className="ticket-meta text-brand-stamp">★ {match.stage || 'Group Stage'}</p>
            <p className="mt-1 font-mono text-[0.68rem] tabular-nums text-brand-muted">
              {match.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}
              {match.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {' · '}
              {match.venue}
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 px-4 py-5">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="grid h-12 min-w-16 place-items-center rounded border border-brand-border bg-brand-card px-2 text-5xl shadow-sm">{match.homeTeam.flag}</span>
              <span className="ticket-meta mt-2">{match.homeTeamId.slice(0, 3)}</span>
              <span className="font-display text-lg leading-tight text-brand-ink text-center">{getCountryName(match.homeTeam.name)}</span>
            </div>
            {matchClosed && match.homeScore !== null && match.awayScore !== null ? (
              <div className="flex flex-col items-center self-center px-3">
                {match.status === 'live' && (
                  <span className="ticket-pill ticket-pill-stamp mb-1">Live</span>
                )}
                <span className="font-display text-4xl leading-none text-brand-ink tabular-nums">{match.homeScore}:{match.awayScore}</span>
              </div>
            ) : (
              <span className="grid h-11 w-11 place-items-center self-center rounded-full border-2 border-brand-ink bg-brand-card font-display text-base text-brand-ink">vs</span>
            )}
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="grid h-12 min-w-16 place-items-center rounded border border-brand-border bg-brand-card px-2 text-5xl shadow-sm">{match.awayTeam.flag}</span>
              <span className="ticket-meta mt-2">{match.awayTeamId.slice(0, 3)}</span>
              <span className="font-display text-lg leading-tight text-brand-ink text-center">{getCountryName(match.awayTeam.name)}</span>
            </div>
          </div>

          {/* Outcome selector */}
          <div className="border-t border-dashed border-brand-border px-4 py-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <p className="ticket-meta text-brand-muted">{knockout ? 'Pick the winner' : 'Pick the outcome'}</p>
              <p className="ticket-meta">{knockout ? '4 options' : '3 options'}</p>
            </div>
          <div className="flex gap-2">
            {outcomes.map((o) => (
              <button
                key={o}
                onClick={() => {
                  if (!canEditPrediction) return
                  setSelectedOutcome(o)
                  setSaveError(null)
                }}
                disabled={!canEditPrediction}
                className={`relative flex-1 rounded-md border px-2 py-3 transition-colors ${
                  selectedOutcome === o
                    ? 'bg-brand-accent text-brand-bg border-brand-accent shadow-lg shadow-brand-ink/15'
                    : 'bg-brand-card text-brand-ink border-brand-border hover:border-brand-ink'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <span className="block font-display text-3xl leading-none tabular-nums">{o}</span>
                <span className="ticket-meta block text-[0.5rem]">
                  {o === '1' ? 'Home' : o === '2' ? 'Away' : 'Draw'}
                </span>
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Submit button */}
        {canEditPrediction && (
          <motion.button
            onClick={handleSubmit}
            disabled={saving || navigating || !isDirty}
            whileTap={{ scale: 0.97 }}
            className={`ticket-button w-full rounded py-4 transition-colors ${
              navigating
                ? 'bg-emerald-700 text-brand-ticket'
                : isSaved
                ? 'bg-emerald-700 text-brand-ticket'
                : 'bg-brand-accent text-brand-bg hover:bg-brand-accent-hover disabled:opacity-50'
            }`}
          >
            {saving
              ? 'Saving...'
              : navigating
              ? 'Saved · Moving on...'
              : isSaved
              ? 'Prediction saved'
              : 'Save Prediction'}
          </motion.button>
        )}

        {saveError && (
          <p className="border-l-4 border-brand-stamp bg-brand-stamp/10 px-4 py-3 text-sm text-brand-stamp">
            {saveError}
          </p>
        )}

        {!canEditPrediction && (
          savedOutcome ? (
            <div className="ticket-card flex w-full items-center justify-center gap-2 px-4 py-4 font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              You predicted {savedOutcome} · Locked
            </div>
          ) : (
            <div className="w-full rounded border border-dashed border-brand-border py-4 text-center font-semibold text-brand-faint">
              {lockMessage}
            </div>
          )
        )}

        {/* Other players' predictions */}
        {showPredictionsList && (
          <div>
            <h2 className="ticket-meta mb-3 text-brand-muted">
              Everyone's Predictions
            </h2>
            <div className="space-y-2">
              {allPredictions.map((p) => {
                const isMe = p.userId === user?.uid
                const displayName = isMe ? user?.displayName ?? p.displayName : p.displayName
                const avatarUrl = isMe ? user?.avatarUrl ?? p.avatarUrl : p.avatarUrl

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between bg-brand-card border rounded-md px-4 py-3 ${
                      isMe ? 'border-brand-accent/50' : 'border-brand-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar url={avatarUrl} name={displayName} className="w-8 h-8" />
                      <span className="text-sm font-medium text-brand-ink">
                        {isMe ? `${displayName} (you)` : displayName}
                      </span>
                    </div>
                    <span className="ticket-stamp !text-sm">{p.outcome}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
