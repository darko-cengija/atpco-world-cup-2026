import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { getCountryName } from '@/lib/translations'
import { actualOutcome as computeActualOutcome } from '@/lib/predictions'
import { useWinningChances } from '@/hooks/useWinningChances'
import type { PredictionOutcome, Team } from '@/types'
import { TicketSpinner } from '@/components/TicketMark'

interface TeamStats {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

type Totals = Omit<TeamStats, 'team'>

interface PastPrediction {
  matchId: string
  date: Date
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  actualOutcome: PredictionOutcome
  playerOutcome: PredictionOutcome | null
}

const TH = 'px-2 py-2 font-mono font-bold text-[9px] uppercase tracking-[0.14em] text-brand-faint whitespace-nowrap'
const TD = 'px-2 py-3 font-mono text-xs text-center text-brand-muted tabular-nums'

function sortTeamStats(a: TeamStats, b: TeamStats) {
  if (b.points !== a.points) return b.points - a.points
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  return b.won - a.won
}

function formatTableNumber(value: number, projected: boolean) {
  return projected ? value.toFixed(1) : String(value)
}

function formatGoalDifference(value: number, projected: boolean) {
  const rounded = projected ? value.toFixed(1) : String(value)
  if (value > 0) return `+${rounded}`
  return rounded
}

export default function PlayerPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const projectionRequested = new URLSearchParams(location.search).get('projection') === '1'
  const { chances } = useWinningChances()

  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [predictions, setPredictions] = useState<PastPrediction[]>([])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const [
        userSnap,
        ptSnap,
        teamsSnap,
        matchesSnap,
        predsSnap,
        configSnap,
      ] = await Promise.all([
        getDoc(doc(db, 'users', userId!)),
        getDocs(query(collection(db, 'playerTeams'), where('userId', '==', userId))),
        getDocs(collection(db, 'teams')),
        getDocs(query(collection(db, 'matches'), where('status', 'in', ['finished', 'live']))),
        getDocs(query(collection(db, 'predictions'), where('userId', '==', userId))),
        getDoc(doc(db, 'config', 'app')),
      ])
      if (cancelled) return

      const userData = userSnap.data()
      const name = (userData?.displayName as string | undefined) ?? ''
      const avatar = (userData?.avatarUrl as string | null | undefined) ?? null

      const gameStartedAt = (configSnap.data()?.gameStartedAt as Timestamp | undefined) ?? null

      const teamById: Record<string, Team> = {}
      for (const d of teamsSnap.docs) {
        teamById[d.id] = { id: d.id, ...d.data() } as Team
      }

      const playerTeams = ptSnap.docs
        .map((d) => teamById[d.data().teamId as string])
        .filter((t): t is Team => !!t)

      const stats: TeamStats[] = playerTeams.map((team) => ({
        team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
      }))
      const statsByTeamId: Record<string, TeamStats> = {}
      for (const s of stats) statsByTeamId[s.team.id] = s

      // Team stats: iterate matches after gameStartedAt; use regulation-time score
      // for KO matches that went to ET (consistent with useMainStandings).
      for (const matchDoc of matchesSnap.docs) {
        const data = matchDoc.data()
        const dateTs = data.date as Timestamp | undefined
        if (!dateTs || !gameStartedAt || dateTs.toMillis() < gameStartedAt.toMillis()) continue

        const hasRegTime = data.regularTimeScoreHome != null
        const hs = hasRegTime ? (data.regularTimeScoreHome as number) : (data.homeScore as number | null)
        const as = hasRegTime ? (data.regularTimeScoreAway as number) : (data.awayScore as number | null)
        if (hs == null || as == null) continue

        const homeStats = statsByTeamId[data.homeTeamId as string]
        const awayStats = statsByTeamId[data.awayTeamId as string]

        if (homeStats) {
          homeStats.played++
          homeStats.gf += hs
          homeStats.ga += as
          if (hs > as) { homeStats.won++; homeStats.points += 3 }
          else if (hs === as) { homeStats.drawn++; homeStats.points += 1 }
          else homeStats.lost++
        }
        if (awayStats) {
          awayStats.played++
          awayStats.gf += as
          awayStats.ga += hs
          if (as > hs) { awayStats.won++; awayStats.points += 3 }
          else if (as === hs) { awayStats.drawn++; awayStats.points += 1 }
          else awayStats.lost++
        }
      }

      for (const s of stats) s.gd = s.gf - s.ga

      stats.sort(sortTeamStats)

      const tot: Totals = stats.reduce<Totals>(
        (acc, s) => ({
          played: acc.played + s.played,
          won: acc.won + s.won,
          drawn: acc.drawn + s.drawn,
          lost: acc.lost + s.lost,
          gf: acc.gf + s.gf,
          ga: acc.ga + s.ga,
          gd: acc.gd + s.gd,
          points: acc.points + s.points,
        }),
        { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      )

      // Past predictions: finished matches only, every match gets a row
      // (even if the player didn't vote — rendered as "–").
      const userPredByMatch: Record<string, PredictionOutcome> = {}
      for (const d of predsSnap.docs) {
        const pdata = d.data()
        userPredByMatch[pdata.matchId as string] = pdata.outcome as PredictionOutcome
      }

      const preds: PastPrediction[] = []
      for (const matchDoc of matchesSnap.docs) {
        const data = matchDoc.data()
        if (data.status !== 'finished') continue
        const dateTs = data.date as Timestamp | undefined
        if (!dateTs || !gameStartedAt || dateTs.toMillis() < gameStartedAt.toMillis()) continue
        if (data.homeScore == null || data.awayScore == null) continue

        const fallback = (id: string) => ({ id, name: id, flag: '🏳️', group: '' })
        const homeTeam = teamById[data.homeTeamId as string] ?? fallback(data.homeTeamId as string)
        const awayTeam = teamById[data.awayTeamId as string] ?? fallback(data.awayTeamId as string)

        preds.push({
          matchId: matchDoc.id,
          date: dateTs.toDate(),
          homeTeam,
          awayTeam,
          homeScore: data.homeScore as number,
          awayScore: data.awayScore as number,
          actualOutcome: computeActualOutcome(
            data.homeScore as number,
            data.awayScore as number,
            (data.qualifier ?? null) as 'home' | 'away' | null,
          ),
          playerOutcome: userPredByMatch[matchDoc.id] ?? null,
        })
      }

      preds.sort((a, b) => b.date.getTime() - a.date.getTime())

      setDisplayName(name)
      setAvatarUrl(avatar)
      setTeamStats(stats)
      setTotals(tot)
      setPredictions(preds)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <TicketSpinner label="Loading player" />
      </div>
    )
  }

  const projection = chances.find((row) => row.userId === userId)
  const projectedTeamsById = new Map(
    (projection?.projectedTeams ?? []).map((team) => [team.teamId, team]),
  )
  const showingProjection = projectionRequested && projectedTeamsById.size > 0
  const visibleTeamStats = showingProjection
    ? teamStats
        .map((stat) => {
          const projected = projectedTeamsById.get(stat.team.id)
          if (!projected) return stat
          return {
            team: stat.team,
            played: projected.played,
            won: projected.won,
            drawn: projected.drawn,
            lost: projected.lost,
            gf: projected.gf,
            ga: projected.ga,
            gd: projected.gd,
            points: projected.points,
          }
        })
        .sort(sortTeamStats)
    : teamStats
  const visibleTotals = showingProjection && projection?.projectedStanding
    ? projection.projectedStanding
    : totals

  return (
    <div className={showingProjection ? 'pb-20' : ''}>
      <div className="flex items-center gap-3 px-4 pt-2 pb-2">
        <button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-brand-border text-brand-ink hover:border-brand-ink transition-colors">
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 px-4 pb-6">
        <PlayerAvatar url={avatarUrl} name={displayName} />
        <p className="ticket-meta text-brand-stamp">★ Player dossier</p>
        <h1 className="font-display text-[2.2rem] leading-none text-brand-ink">{displayName}</h1>
      </div>

      <div className="px-4 mb-8">
        <TeamTable teamStats={visibleTeamStats} totals={visibleTotals} projected={showingProjection} />
      </div>

      {!showingProjection && (
        <div className="px-4 pb-8">
          <h2 className="ticket-meta mb-3 text-brand-muted">Predictions</h2>
          {predictions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brand-border text-brand-faint text-center py-6 text-sm">No finished matches yet.</p>
          ) : (
            <div className="ticket-card">
              {predictions.map((p) => (
                <PredictionRow key={p.matchId} p={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {showingProjection && (
        <div className="fixed bottom-20 left-3 right-3 z-40 rounded-md border border-brand-stamp/50 bg-brand-stamp px-3 py-3 text-brand-ticket shadow-2xl">
          <p className="font-mono text-xs font-black uppercase tracking-wide">
            Simulation: average of 10,000 scenarios for remaining matches
          </p>
        </div>
      )}
    </div>
  )
}

function PlayerAvatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-24 h-24 rounded-full bg-brand-ink text-brand-ticket ring-4 ring-brand-card flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
      {url?.startsWith('emoji:') ? (
        <span className="text-5xl leading-none">{url.replace('emoji:', '')}</span>
      ) : url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-4xl font-bold text-brand-ticket">{name[0]?.toUpperCase()}</span>
      )}
    </div>
  )
}

function TeamTable({
  teamStats,
  totals,
  projected,
}: {
  teamStats: TeamStats[]
  totals: Totals | null
  projected: boolean
}) {
  return (
    <div className="ticket-card">
      <table className="w-full border-collapse">
        <colgroup>
          <col className="w-8" />                                     {/* flag */}
          <col className="w-[150px]" />                               {/* team name */}
          <col className="w-8" />                                     {/* O */}
          <col className="w-8 hidden min-[390px]:table-column" />     {/* P */}
          <col className="w-8 hidden min-[430px]:table-column" />     {/* N */}
          <col className="w-8 hidden sm:table-column" />              {/* I */}
          <col className="w-9 hidden sm:table-column" />              {/* GF */}
          <col className="w-9 hidden sm:table-column" />              {/* GA */}
          <col className="w-9" />                                     {/* GD */}
          <col className="w-9" />                                     {/* Pts */}
        </colgroup>

        <thead>
          <tr className="border-b border-brand-border">
            <th className={`${TH} pl-3`}></th>
            <th className={`${TH} text-left pl-1`}>Team</th>
            <th className={TH}>Pld</th>
            <th className={`${TH} hidden min-[390px]:table-cell`}>W</th>
            <th className={`${TH} hidden min-[430px]:table-cell`}>D</th>
            <th className={`${TH} hidden sm:table-cell`}>L</th>
            <th className={`${TH} hidden sm:table-cell`}>GF</th>
            <th className={`${TH} hidden sm:table-cell`}>GA</th>
            <th className={TH}>GD</th>
            <th className={`${TH} text-gray-400 pr-3`}>Pts</th>
          </tr>
        </thead>

        <tbody>
          {teamStats.map((s) => (
            <tr key={s.team.id} className="border-b border-brand-border">
              <td className="pl-3 pr-1 py-3 text-lg">{s.team.flag}</td>
              <td className="pl-1 pr-2 py-3">
                <span className="font-display text-base leading-none text-brand-ink truncate block">
                  {getCountryName(s.team.name)}
                </span>
              </td>
              <td className={TD}>{formatTableNumber(s.played, projected)}</td>
              <td className={`${TD} hidden min-[390px]:table-cell`}>{formatTableNumber(s.won, projected)}</td>
              <td className={`${TD} hidden min-[430px]:table-cell`}>{formatTableNumber(s.drawn, projected)}</td>
              <td className={`${TD} hidden sm:table-cell`}>{formatTableNumber(s.lost, projected)}</td>
              <td className={`${TD} hidden sm:table-cell`}>{formatTableNumber(s.gf, projected)}</td>
              <td className={`${TD} hidden sm:table-cell`}>{formatTableNumber(s.ga, projected)}</td>
              <td className={TD}>{formatGoalDifference(s.gd, projected)}</td>
              <td className={`${TD} font-display text-lg font-normal text-brand-ink pr-3`}>{formatTableNumber(s.points, projected)}</td>
            </tr>
          ))}

          {totals && (
            <tr className="bg-brand-accent/5">
              <td className="pl-3 pr-1 py-3"></td>
              <td className="pl-1 pr-2 py-3">
                <span className="ticket-meta text-brand-stamp">Total</span>
              </td>
              <td className={`${TD} font-bold text-brand-ink`}>{formatTableNumber(totals.played, projected)}</td>
              <td className={`${TD} font-bold text-brand-ink hidden min-[390px]:table-cell`}>{formatTableNumber(totals.won, projected)}</td>
              <td className={`${TD} font-bold text-brand-ink hidden min-[430px]:table-cell`}>{formatTableNumber(totals.drawn, projected)}</td>
              <td className={`${TD} font-bold text-brand-ink hidden sm:table-cell`}>{formatTableNumber(totals.lost, projected)}</td>
              <td className={`${TD} font-bold text-brand-ink hidden sm:table-cell`}>{formatTableNumber(totals.gf, projected)}</td>
              <td className={`${TD} font-bold text-brand-ink hidden sm:table-cell`}>{formatTableNumber(totals.ga, projected)}</td>
              <td className={`${TD} font-bold text-brand-ink`}>{formatGoalDifference(totals.gd, projected)}</td>
              <td className={`${TD} font-display text-lg font-normal text-brand-ink pr-3`}>{formatTableNumber(totals.points, projected)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function PredictionRow({ p }: { p: PastPrediction }) {
  const correct = p.playerOutcome != null && p.playerOutcome === p.actualOutcome
  const dateStr = p.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

  return (
    <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 px-3 py-2 border-b border-brand-border last:border-0 text-xs">
      <span className="font-mono text-brand-faint tabular-nums">{dateStr}</span>

      <div className="flex items-center justify-center gap-2 min-w-0">
        <span className="text-base shrink-0">{p.homeTeam.flag}</span>
        <span className="font-display text-base text-brand-ink tabular-nums">
          {p.homeScore}–{p.awayScore}
        </span>
        <span className="text-base shrink-0">{p.awayTeam.flag}</span>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <span className="font-semibold text-brand-stamp w-5 text-center">{p.actualOutcome}</span>
        <span className="text-brand-faint">·</span>
        <span className={`flex items-center gap-1 font-semibold ${
          !p.playerOutcome ? 'text-brand-faint' : correct ? 'text-emerald-700' : 'text-brand-stamp'
        }`}>
          <span className="w-5 text-center">{p.playerOutcome ?? '–'}</span>
          <span className="w-3 inline-flex justify-center">
            {p.playerOutcome && (correct ? <Check size={12} /> : <X size={12} />)}
          </span>
        </span>
      </div>
    </div>
  )
}
