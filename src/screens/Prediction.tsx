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
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/Avatar'
import { getCountryName } from '@/lib/translations'
import { HOME_MATCH_WINDOW } from '@/lib/config'
import type { Match, Prediction, AppUser, PredictionOutcome } from '@/types'

async function findNextUnpredictedMatch(currentMatchId: string, userId: string): Promise<string | null> {
  const [matchSnap, predSnap] = await Promise.all([
    getDocs(query(collection(db, 'matches'), where('status', '==', 'upcoming'), orderBy('date', 'asc'), limit(HOME_MATCH_WINDOW))),
    getDocs(query(collection(db, 'predictions'), where('userId', '==', userId))),
  ])

  const orderedMatchIds = matchSnap.docs.map((d) => d.id)
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

async function fetchMatch(matchId: string): Promise<Match | null> {
  const snap = await getDoc(doc(db, 'matches', matchId))
  if (!snap.exists()) return null
  const data = snap.data()

  const [homeSnap, awaySnap] = await Promise.all([
    getDoc(doc(db, 'teams', data.homeTeamId)),
    getDoc(doc(db, 'teams', data.awayTeamId)),
  ])

  if (!homeSnap.exists() || !awaySnap.exists()) return null

  return {
    id: snap.id,
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
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [, forceTick] = useState(0)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current) }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [])

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
    fetchMatch(matchId).then((m) => {
      setMatch(m)
      setLoading(false)
    })
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

    setSaving(true)
    const predId = `${matchId}_${user.uid}`
    await setDoc(doc(db, 'predictions', predId), {
      matchId,
      userId: user.uid,
      outcome: selectedOutcome,
      submittedAt: serverTimestamp(),
    })
    setSaving(false)
    setNavigating(true)

    const nextId = await findNextUnpredictedMatch(matchId, user.uid)
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
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-gray-400">
        Match not found.
      </div>
    )
  }

  const isLocked = match.status !== 'upcoming' || match.date.getTime() <= Date.now()
  const knockout = isKnockout(match.stage)
  const outcomes: PredictionOutcome[] = knockout ? ['1', 'X1', 'X2', '2'] : ['1', 'X', '2']

  const savedOutcome = allPredictions.find(p => p.userId === user?.uid)?.outcome ?? null
  const isSaved = selectedOutcome !== null && selectedOutcome === savedOutcome
  const isDirty = selectedOutcome !== null && selectedOutcome !== savedOutcome

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-white">Prediction</h1>
        {isLocked && <Lock size={16} className="text-yellow-500 ml-auto" />}
      </div>

      <div className="px-4 space-y-6">
        {/* Match card */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <p className="text-xs text-gray-400 text-center mb-4">
            {match.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}
            {match.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' · '}
            {match.venue}
          </p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-5xl">{match.homeTeam.flag}</span>
              <span className="font-semibold text-white text-sm text-center">{getCountryName(match.homeTeam.name)}</span>
            </div>
            {isLocked && match.homeScore !== null && match.awayScore !== null ? (
              <div className="flex flex-col items-center px-3">
                {match.status === 'live' && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Live</span>
                )}
                <span className="text-white font-bold text-2xl tabular-nums">{match.homeScore} – {match.awayScore}</span>
              </div>
            ) : (
              <span className="text-gray-600 font-bold text-lg px-3">VS</span>
            )}
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-5xl">{match.awayTeam.flag}</span>
              <span className="font-semibold text-white text-sm text-center">{getCountryName(match.awayTeam.name)}</span>
            </div>
          </div>

          {/* Outcome selector */}
          <div className="flex gap-2">
            {outcomes.map((o) => (
              <button
                key={o}
                onClick={() => !isLocked && setSelectedOutcome(o)}
                disabled={isLocked}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors border ${
                  selectedOutcome === o
                    ? 'bg-brand-accent text-brand-bg border-brand-accent'
                    : 'bg-brand-bg text-gray-400 border-brand-border hover:border-gray-500 hover:text-white'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        {!isLocked && (
          <motion.button
            onClick={handleSubmit}
            disabled={saving || navigating || !isDirty}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-colors ${
              navigating
                ? 'bg-emerald-600 text-white'
                : isSaved
                ? 'bg-emerald-600 text-white'
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

        {isLocked && (
          savedOutcome ? (
            <div className="w-full py-4 rounded-xl bg-emerald-900/40 border border-emerald-700 text-emerald-400 font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              You predicted {savedOutcome} · Locked
            </div>
          ) : (
            <div className="w-full py-4 rounded-xl bg-brand-border text-gray-500 font-semibold text-center">
              No prediction · Locked
            </div>
          )
        )}

        {/* Other players' predictions */}
        {allPredictions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
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
                    className={`flex items-center justify-between bg-brand-card border rounded-lg px-4 py-3 ${
                      isMe ? 'border-brand-accent/50' : 'border-brand-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar url={avatarUrl} name={displayName} className="w-8 h-8" />
                      <span className="text-sm font-medium text-white">
                        {isMe ? `${displayName} (you)` : displayName}
                      </span>
                    </div>
                    <span className="font-bold text-white text-base">{p.outcome}</span>
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
