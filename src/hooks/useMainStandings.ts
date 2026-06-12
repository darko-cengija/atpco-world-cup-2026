import { useEffect, useRef, useState } from 'react'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { PlayerStanding, Team } from '@/types'

// ─── Tournament ranking derivation ──────────────────────────────────────────
//
// After the tournament ends we use each player's best-ranked team as a
// tiebreaker. Rankings are derived automatically from match results:
//
//   1  – winner of the Final
//   2  – runner-up (loser of the Final)
//   3  – winner of Third Place Play-off
//   4  – loser of Third Place Play-off
//   5  – teams knocked out in Semi-finals (all reach top 4 via 3rd-place game,
//        so in practice no team stops at this stage — reserved for safety)
//   9  – teams knocked out in Quarter-finals
//   13 – teams knocked out in Round of 16
//   17 – teams knocked out in Round of 32
//   33 – teams eliminated in Group Stage

interface MatchRow {
  homeTeamId: string
  awayTeamId: string
  stage: string
  homeScore: number | null
  awayScore: number | null
  qualifier: 'home' | 'away' | null
  dateMs: number
}

type UserInfo = { uid: string; displayName: string; avatarUrl: string | null }

const STAGE_PRIORITY: Record<string, number> = {
  'Group Stage': 0,
  'Round of 32': 1,
  'Round of 16': 2,
  'Quarter-finals': 3,
  'Semi-finals': 4,
  'Third Place Play-off': 5,
  'Final': 6,
}

const ELIM_RANK: Record<number, number> = {
  0: 33, // group stage out
  1: 17, // lost in Round of 32
  2: 13, // lost in Round of 16
  3: 9,  // lost in Quarter-finals
  4: 5,  // lost in Semi-finals (safety; shouldn't occur post-tournament)
}

const compareNames = (a: string, b: string) =>
  a.localeCompare(b, 'hr', { sensitivity: 'base' })

/** Returns true if the home team won (including via ET/penalties). */
function homeWon(m: MatchRow): boolean {
  if (m.homeScore === null || m.awayScore === null) return false
  if (m.homeScore > m.awayScore) return true
  if (m.homeScore < m.awayScore) return false
  return m.qualifier === 'home' // draw in regular time, home advanced via ET/pens
}

/**
 * Derives each team's final tournament rank from match data.
 * Returns a map of teamId → rank (1 = winner). Only meaningful after the Final.
 */
function computeTeamRanks(matches: MatchRow[]): Record<string, number> {
  const ranks: Record<string, number> = {}

  // 1 & 2: Final
  const finalMatch = matches.find((m) => m.stage === 'Final')
  if (finalMatch) {
    const hw = homeWon(finalMatch)
    ranks[hw ? finalMatch.homeTeamId : finalMatch.awayTeamId] = 1
    ranks[hw ? finalMatch.awayTeamId : finalMatch.homeTeamId] = 2
  }

  // 3 & 4: Third Place Play-off
  const tp = matches.find((m) => m.stage === 'Third Place Play-off')
  if (tp) {
    const hw = homeWon(tp)
    ranks[hw ? tp.homeTeamId : tp.awayTeamId] = 3
    ranks[hw ? tp.awayTeamId : tp.homeTeamId] = 4
  }

  // Everyone else: assign rank based on the stage they were eliminated in.
  const teamBestPriority: Record<string, number> = {}
  for (const m of matches) {
    const p = STAGE_PRIORITY[m.stage] ?? 0
    for (const tid of [m.homeTeamId, m.awayTeamId]) {
      if ((teamBestPriority[tid] ?? -1) < p) teamBestPriority[tid] = p
    }
  }

  for (const [teamId, priority] of Object.entries(teamBestPriority)) {
    if (ranks[teamId] !== undefined) continue
    const r = ELIM_RANK[priority]
    if (r !== undefined) ranks[teamId] = r
  }

  return ranks
}

/** Returns the best (lowest number) rank among a player's teams. */
function bestTeamRank(teams: Team[], rankMap: Record<string, number>): number {
  let best = Infinity
  for (const t of teams) {
    const r = rankMap[t.id]
    if (r !== undefined && r < best) best = r
  }
  return best
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMainStandings() {
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [loading, setLoading] = useState(true)

  // Static assignments stay ID-based, while teams are live so replacement slots
  // can update names/flags without changing ownership.
  const usersRef = useRef<UserInfo[]>([])
  const userTeamIdsRef = useRef<Record<string, string[]>>({})
  const teamByIdRef = useRef<Record<string, Team>>({})
  const matchRowsRef = useRef<MatchRow[]>([])
  const gameStartedAtRef = useRef<Timestamp | null>(null)

  useEffect(() => {
    let unsubscribeMatches: (() => void) | null = null
    let unsubscribeTeams: (() => void) | null = null

    function recalculate() {
      const gameStartedAt = gameStartedAtRef.current
      const allMatchRows = matchRowsRef.current
      const teamById = teamByIdRef.current

      const matchRows = gameStartedAt
        ? allMatchRows.filter((m) => m.dateMs >= gameStartedAt.toMillis())
        : []

      const tournamentOver = matchRows.some((m) => m.stage === 'Final')
      const teamRanks = tournamentOver ? computeTeamRanks(matchRows) : {}

      const result: PlayerStanding[] = []

      for (const u of usersRef.current) {
        const teamIds = userTeamIdsRef.current[u.uid] ?? []
        const teams = teamIds
          .map((teamId) => teamById[teamId])
          .filter((team): team is Team => Boolean(team))

        let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, points = 0

        const ownedTeamIds = new Set(teamIds)

        for (const m of matchRows) {
          if (m.homeScore == null || m.awayScore == null) continue

          const ownedResults: Array<{ gf: number; ga: number }> = []
          if (ownedTeamIds.has(m.homeTeamId)) {
            ownedResults.push({ gf: m.homeScore, ga: m.awayScore })
          }
          if (ownedTeamIds.has(m.awayTeamId)) {
            ownedResults.push({ gf: m.awayScore, ga: m.homeScore })
          }

          for (const { gf: teamGF, ga: teamGA } of ownedResults) {
            played++
            gf += teamGF
            ga += teamGA

            if (teamGF > teamGA) { won++; points += 3 }
            else if (teamGF === teamGA) { drawn++; points += 1 }
            else { lost++ }
          }
        }

        result.push({
          userId: u.uid,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          played, won, drawn, lost, gf, ga,
          gd: gf - ga,
          points,
          teams,
        })
      }

      result.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (tournamentOver) {
          const rankA = bestTeamRank(a.teams, teamRanks)
          const rankB = bestTeamRank(b.teams, teamRanks)
          if (rankA !== rankB) return rankA - rankB
        }
        if (b.gd !== a.gd) return b.gd - a.gd
        if (b.gf !== a.gf) return b.gf - a.gf
        if (b.won !== a.won) return b.won - a.won
        return compareNames(a.displayName, b.displayName)
      })

      setStandings(result)
      setLoading(false)
    }

    async function init() {
      const [usersSnap, configSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDoc(doc(db, 'config', 'app')),
      ])

      usersRef.current = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as { displayName: string; avatarUrl: string | null }),
      }))
      gameStartedAtRef.current =
        (configSnap.data()?.gameStartedAt as Timestamp | undefined) ?? null

      const ptSnap = await getDocs(collection(db, 'playerTeams'))
      for (const u of usersRef.current) userTeamIdsRef.current[u.uid] = []
      for (const ptDoc of ptSnap.docs) {
        const { userId, teamId } = ptDoc.data() as { userId: string; teamId: string }
        if (userTeamIdsRef.current[userId]) userTeamIdsRef.current[userId].push(teamId)
      }

      unsubscribeTeams = onSnapshot(collection(db, 'teams'), (teamsSnap) => {
        const teamById: Record<string, Team> = {}
        for (const teamDoc of teamsSnap.docs) {
          teamById[teamDoc.id] = { id: teamDoc.id, ...teamDoc.data() } as Team
        }
        teamByIdRef.current = teamById
        recalculate()
      })

      // Real-time listener: finished matches + live matches
      const matchesQuery = query(
        collection(db, 'matches'),
        where('status', 'in', ['finished', 'live']),
      )

      unsubscribeMatches = onSnapshot(matchesQuery, (matchesSnap) => {
        matchRowsRef.current = matchesSnap.docs.map((d) => {
          const data = d.data()
          // KO matches that went to ET: use regulation-time score for standings.
          // regularTimeScoreHome is written by the live/bulk sync when ET begins.
          const hasRegTime = data.regularTimeScoreHome != null
          return {
            homeTeamId: data.homeTeamId as string,
            awayTeamId: data.awayTeamId as string,
            stage: (data.stage ?? 'Group Stage') as string,
            homeScore: hasRegTime
              ? (data.regularTimeScoreHome as number)
              : (data.homeScore as number | null),
            awayScore: hasRegTime
              ? (data.regularTimeScoreAway as number)
              : (data.awayScore as number | null),
            qualifier: (data.qualifier ?? null) as 'home' | 'away' | null,
            dateMs: (data.date as Timestamp | undefined)?.toMillis() ?? 0,
          }
        })
        recalculate()
      })
    }

    init()
    return () => {
      unsubscribeMatches?.()
      unsubscribeTeams?.()
    }
  }, [])

  return { standings, loading }
}
