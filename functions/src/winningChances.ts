import * as admin from 'firebase-admin'
import {
  THIRD_PLACE_ASSIGNMENTS,
  THIRD_PLACE_WINNER_GROUP_ORDER,
} from './worldCup2026ThirdPlaceAssignments'

type GroupCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'
type Stage =
  | 'Group Stage'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-finals'
  | 'Semi-finals'
  | 'Third Place Play-off'
  | 'Final'

interface TeamRow {
  id: string
  name: string
  group: GroupCode
  fifaRank?: number
  fifaPoints?: number
  replacement?: {
    active?: boolean
  }
  apiFootballAliases?: string[]
}

interface MatchRow {
  id: string
  matchNumber: number
  stage: Stage
  homeTeamId: string
  awayTeamId: string
  status: string
  date: Date | null
  homeScore: number | null
  awayScore: number | null
  regularTimeScoreHome: number | null
  regularTimeScoreAway: number | null
  qualifier: 'home' | 'away' | null
}

interface PlayerRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  teamIds: string[]
}

interface MatchProbability {
  home: number
  draw: number
  away: number
  source: 'odds' | 'rank'
}

interface PlayedMatch {
  matchNumber: number
  stage: Stage
  homeTeamId: string
  awayTeamId: string
  homeScore: number
  awayScore: number
  winnerTeamId: string | null
  loserTeamId: string | null
}

interface GroupStanding {
  teamId: string
  group: GroupCode
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

interface PlayerSimStanding {
  player: PlayerRow
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  bestRank: number
}

interface ProjectedPlayerStanding {
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

interface ProjectedTeamStanding extends ProjectedPlayerStanding {
  teamId: string
}

interface ApiFootballFixture {
  fixture: { id: number; date: string }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
}

interface ApiFootballOddsValue {
  value: string
  odd: string
}

interface ApiFootballOddsBet {
  id: number
  name: string
  values: ApiFootballOddsValue[]
}

interface ApiFootballOddsBookmaker {
  bets: ApiFootballOddsBet[]
}

interface ApiFootballOddsFixture {
  fixture: { id: number }
  bookmakers: ApiFootballOddsBookmaker[]
}

interface ApiFootballResponse<T> {
  response: T[]
  paging?: { current: number; total: number }
}

const API_BASE = 'https://v3.football.api-sports.io'
const WORLD_CUP_LEAGUE_ID = 1
const WORLD_CUP_SEASON = 2026
const MATCH_WINNER_BET_ID = 1
const SIMULATION_COUNT = 10000
const ODDS_WINDOW_DAYS = 14
const MS_PER_DAY = 24 * 60 * 60 * 1000
const GROUP_CODES: GroupCode[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

const FIFA_POINTS_BY_TEAM_ID: Record<string, number> = {
  france: 1877.32,
  spain: 1876.40,
  argentina: 1874.81,
  england: 1825.97,
  portugal: 1763.83,
  brazil: 1761.16,
  netherlands: 1757.87,
  morocco: 1755.87,
  belgium: 1734.71,
  germany: 1730.37,
  croatia: 1717.07,
  colombia: 1693.09,
  senegal: 1688.99,
  mexico: 1681.03,
  usa: 1673.13,
  uruguay: 1673.07,
  japan: 1660.43,
  switzerland: 1649.40,
  iran: 1615.30,
  turkiye: 1599.04,
  ecuador: 1594.78,
  austria: 1593.45,
  'korea-republic': 1588.66,
  australia: 1580.67,
  algeria: 1564.26,
  egypt: 1563.24,
  canada: 1556.48,
  norway: 1550.94,
  panama: 1540.64,
  'cote-divoire': 1532.98,
  sweden: 1514.77,
  paraguay: 1503.50,
  czechia: 1501.38,
  scotland: 1498.35,
  tunisia: 1483.05,
  'congo-dr': 1478.35,
  uzbekistan: 1465.34,
  qatar: 1454.96,
  iraq: 1447.14,
  'south-africa': 1429.73,
  'saudi-arabia': 1421.43,
  jordan: 1391.45,
  'bosnia-and-herzegovina': 1385.84,
  'cabo-verde': 1366.13,
  ghana: 1346.31,
  curacao: 1294.65,
  haiti: 1291.71,
  'new-zealand': 1281.57,
}

const R16_PAIRINGS: Array<[number, number, number]> = [
  [89, 74, 77],
  [90, 73, 75],
  [91, 76, 78],
  [92, 79, 80],
  [93, 83, 84],
  [94, 81, 82],
  [95, 86, 88],
  [96, 85, 87],
]

const QF_PAIRINGS: Array<[number, number, number]> = [
  [97, 89, 90],
  [98, 93, 94],
  [99, 91, 92],
  [100, 95, 96],
]

const SF_PAIRINGS: Array<[number, number, number]> = [
  [101, 97, 98],
  [102, 99, 100],
]

const API_NAME_ALIASES: Record<string, string> = {
  'bosnia herzegovina': 'bosnia-and-herzegovina',
  'bosnia and herzegovina': 'bosnia-and-herzegovina',
  'cabo verde': 'cabo-verde',
  'cape verde': 'cabo-verde',
  'congo dr': 'congo-dr',
  'dr congo': 'congo-dr',
  'democratic republic of congo': 'congo-dr',
  'cote divoire': 'cote-divoire',
  'ivory coast': 'cote-divoire',
  'curacao': 'curacao',
  'czech republic': 'czechia',
  'czechia': 'czechia',
  'korea republic': 'korea-republic',
  'south korea': 'korea-republic',
  'republic of korea': 'korea-republic',
  'turkey': 'turkiye',
  'turkiye': 'turkiye',
  'united states': 'usa',
  'usa': 'usa',
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()
}

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6d2b79f5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}

function samplePoisson(lambda: number, rng: () => number) {
  const limit = Math.exp(-lambda)
  let product = 1
  let goals = 0

  do {
    goals++
    product *= rng()
  } while (product > limit)

  return goals - 1
}

function teamRating(teamId: string, teamById: Map<string, TeamRow>) {
  const team = teamById.get(teamId)
  if (team?.replacement?.active !== true) {
    const points = typeof team?.fifaPoints === 'number'
      ? team.fifaPoints
      : FIFA_POINTS_BY_TEAM_ID[teamId]
    if (typeof points === 'number') return points
  }

  const rank = team?.fifaRank ?? 100
  return 2150 - (rank - 1) * 8
}

function expectedWinProbability(homeTeamId: string, awayTeamId: string, teamById: Map<string, TeamRow>) {
  const delta = teamRating(homeTeamId, teamById) - teamRating(awayTeamId, teamById)
  return 1 / (1 + 10 ** (-delta / 400))
}

function rankProbability(homeTeamId: string, awayTeamId: string, teamById: Map<string, TeamRow>): MatchProbability {
  const homeNoDraw = expectedWinProbability(homeTeamId, awayTeamId, teamById)
  const ratingDelta = Math.abs(teamRating(homeTeamId, teamById) - teamRating(awayTeamId, teamById))
  const draw = clamp(0.29 - ratingDelta / 2500, 0.14, 0.31)
  return {
    home: homeNoDraw * (1 - draw),
    draw,
    away: (1 - homeNoDraw) * (1 - draw),
    source: 'rank',
  }
}

function simulatedScore(homeTeamId: string, awayTeamId: string, teamById: Map<string, TeamRow>, rng: () => number) {
  const delta = teamRating(homeTeamId, teamById) - teamRating(awayTeamId, teamById)
  const homeExpectedGoals = clamp(1.25 * Math.exp(delta / 900), 0.25, 3.4)
  const awayExpectedGoals = clamp(1.25 * Math.exp(-delta / 900), 0.25, 3.4)

  return {
    homeScore: samplePoisson(homeExpectedGoals, rng),
    awayScore: samplePoisson(awayExpectedGoals, rng),
  }
}

function forceOutcomeScore(
  outcome: 'home' | 'draw' | 'away',
  homeTeamId: string,
  awayTeamId: string,
  teamById: Map<string, TeamRow>,
  rng: () => number,
) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const score = simulatedScore(homeTeamId, awayTeamId, teamById, rng)
    if (outcome === 'home' && score.homeScore > score.awayScore) return score
    if (outcome === 'draw' && score.homeScore === score.awayScore) return score
    if (outcome === 'away' && score.homeScore < score.awayScore) return score
  }

  const score = simulatedScore(homeTeamId, awayTeamId, teamById, rng)
  if (outcome === 'home') return { homeScore: Math.max(score.homeScore, score.awayScore + 1), awayScore: score.awayScore }
  if (outcome === 'away') return { homeScore: score.homeScore, awayScore: Math.max(score.awayScore, score.homeScore + 1) }
  const goals = Math.round((score.homeScore + score.awayScore) / 2)
  return { homeScore: goals, awayScore: goals }
}

function pickOutcome(probability: MatchProbability, rng: () => number): 'home' | 'draw' | 'away' {
  const roll = rng()
  if (roll < probability.home) return 'home'
  if (roll < probability.home + probability.draw) return 'draw'
  return 'away'
}

function fixedScores(match: MatchRow) {
  return {
    homeScore: match.regularTimeScoreHome ?? match.homeScore ?? 0,
    awayScore: match.regularTimeScoreAway ?? match.awayScore ?? 0,
  }
}

function isFixedResult(match: MatchRow | undefined) {
  return (
    match !== undefined &&
    match.status !== 'upcoming' &&
    match.homeScore !== null &&
    match.awayScore !== null
  )
}

function resolveMatchWinner(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  qualifier: 'home' | 'away' | null | undefined,
  stage: Stage,
  teamById: Map<string, TeamRow>,
  rng: () => number,
) {
  if (homeScore > awayScore) return homeTeamId
  if (homeScore < awayScore) return awayTeamId
  if (stage === 'Group Stage') return null
  if (qualifier === 'home') return homeTeamId
  if (qualifier === 'away') return awayTeamId
  return rng() < expectedWinProbability(homeTeamId, awayTeamId, teamById) ? homeTeamId : awayTeamId
}

function simulateMatch(
  matchNumber: number,
  stage: Stage,
  homeTeamId: string,
  awayTeamId: string,
  fixedMatch: MatchRow | undefined,
  probabilitiesByMatchNumber: Map<number, MatchProbability>,
  teamById: Map<string, TeamRow>,
  rng: () => number,
): PlayedMatch {
  const probability = probabilitiesByMatchNumber.get(matchNumber)
  const { homeScore, awayScore } = fixedMatch && isFixedResult(fixedMatch)
    ? fixedScores(fixedMatch)
    : probability
      ? forceOutcomeScore(pickOutcome(probability, rng), homeTeamId, awayTeamId, teamById, rng)
      : simulatedScore(homeTeamId, awayTeamId, teamById, rng)

  const winnerTeamId = resolveMatchWinner(
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    fixedMatch?.qualifier,
    stage,
    teamById,
    rng,
  )
  const loserTeamId = winnerTeamId === null
    ? null
    : winnerTeamId === homeTeamId ? awayTeamId : homeTeamId

  return { matchNumber, stage, homeTeamId, awayTeamId, homeScore, awayScore, winnerTeamId, loserTeamId }
}

function emptyGroupStanding(teamId: string, group: GroupCode): GroupStanding {
  return {
    teamId,
    group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }
}

function applyGroupResult(table: Map<string, GroupStanding>, match: PlayedMatch) {
  const home = table.get(match.homeTeamId)
  const away = table.get(match.awayTeamId)
  if (!home || !away) return

  home.played++
  away.played++
  home.gf += match.homeScore
  home.ga += match.awayScore
  away.gf += match.awayScore
  away.ga += match.homeScore
  home.gd = home.gf - home.ga
  away.gd = away.gf - away.ga

  if (match.homeScore > match.awayScore) {
    home.won++
    away.lost++
    home.points += 3
  } else if (match.homeScore < match.awayScore) {
    away.won++
    home.lost++
    away.points += 3
  } else {
    home.drawn++
    away.drawn++
    home.points++
    away.points++
  }
}

function compareOverallTeamRank(a: GroupStanding, b: GroupStanding, teamById: Map<string, TeamRow>) {
  if (b.points !== a.points) return b.points - a.points
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  return (teamById.get(a.teamId)?.fifaRank ?? 999) - (teamById.get(b.teamId)?.fifaRank ?? 999)
}

function headToHeadStanding(
  teamId: string,
  group: GroupCode,
  tiedTeamIds: Set<string>,
  matches: PlayedMatch[],
) {
  const row = emptyGroupStanding(teamId, group)

  for (const match of matches) {
    if (!tiedTeamIds.has(match.homeTeamId) || !tiedTeamIds.has(match.awayTeamId)) continue
    const isHome = match.homeTeamId === teamId
    const isAway = match.awayTeamId === teamId
    if (!isHome && !isAway) continue

    const gf = isHome ? match.homeScore : match.awayScore
    const ga = isHome ? match.awayScore : match.homeScore
    row.played++
    row.gf += gf
    row.ga += ga
    row.gd = row.gf - row.ga

    if (gf > ga) {
      row.won++
      row.points += 3
    } else if (gf === ga) {
      row.drawn++
      row.points += 1
    } else {
      row.lost++
    }
  }

  return row
}

function rankGroupRows(rows: GroupStanding[], matches: PlayedMatch[], teamById: Map<string, TeamRow>) {
  const byPoints = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return (teamById.get(a.teamId)?.fifaRank ?? 999) - (teamById.get(b.teamId)?.fifaRank ?? 999)
  })

  const ranked: GroupStanding[] = []
  for (let index = 0; index < byPoints.length;) {
    const tied = byPoints.filter((row) => row.points === byPoints[index].points)
    if (tied.length === 1) {
      ranked.push(tied[0])
      index++
      continue
    }

    const tiedTeamIds = new Set(tied.map((row) => row.teamId))
    const h2hByTeam = new Map(tied.map((row) => [
      row.teamId,
      headToHeadStanding(row.teamId, row.group, tiedTeamIds, matches),
    ]))

    ranked.push(...tied.sort((a, b) => {
      const h2hA = h2hByTeam.get(a.teamId) ?? a
      const h2hB = h2hByTeam.get(b.teamId) ?? b
      if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points
      if (h2hB.gd !== h2hA.gd) return h2hB.gd - h2hA.gd
      if (h2hB.gf !== h2hA.gf) return h2hB.gf - h2hA.gf
      return compareOverallTeamRank(a, b, teamById)
    }))
    index += tied.length
  }

  return ranked
}

function groupStandings(groupMatchesPlayed: PlayedMatch[], teams: TeamRow[], teamById: Map<string, TeamRow>) {
  const tables = new Map<GroupCode, Map<string, GroupStanding>>()

  for (const team of teams) {
    if (!tables.has(team.group)) tables.set(team.group, new Map())
    tables.get(team.group)?.set(team.id, emptyGroupStanding(team.id, team.group))
  }

  for (const match of groupMatchesPlayed) {
    const group = teamById.get(match.homeTeamId)?.group
    const table = group ? tables.get(group) : undefined
    if (table) applyGroupResult(table, match)
  }

  return Object.fromEntries(
    GROUP_CODES.map((group) => [
      group,
      rankGroupRows(
        [...(tables.get(group)?.values() ?? [])],
        groupMatchesPlayed.filter((match) => teamById.get(match.homeTeamId)?.group === group),
        teamById,
      ),
    ]),
  ) as Record<GroupCode, GroupStanding[]>
}

function thirdPlaceAssignment(qualifiedThirdGroups: GroupCode[]) {
  const key = [...qualifiedThirdGroups].sort().join('')
  const assignments = THIRD_PLACE_ASSIGNMENTS.get(key)
  if (!assignments) throw new Error(`Missing third-place assignment for ${key}`)

  return Object.fromEntries(
    THIRD_PLACE_WINNER_GROUP_ORDER.map((winnerGroup, index) => [
      winnerGroup,
      assignments[index] as GroupCode,
    ]),
  ) as Record<(typeof THIRD_PLACE_WINNER_GROUP_ORDER)[number], GroupCode>
}

function buildRoundOf32(standings: Record<GroupCode, GroupStanding[]>, teamById: Map<string, TeamRow>) {
  const groupWinner = (group: GroupCode) => standings[group][0].teamId
  const groupRunnerUp = (group: GroupCode) => standings[group][1].teamId
  const groupThird = (group: GroupCode) => standings[group][2]

  const qualifiedThirds = GROUP_CODES
    .map(groupThird)
    .sort((a, b) => compareOverallTeamRank(a, b, teamById))
    .slice(0, 8)
  const qualifiedThirdTeamByGroup = Object.fromEntries(
    qualifiedThirds.map((row) => [row.group, row.teamId]),
  ) as Partial<Record<GroupCode, string>>
  const thirdAssignment = thirdPlaceAssignment(qualifiedThirds.map((row) => row.group))
  const thirdFor = (winnerGroup: keyof typeof thirdAssignment) => {
    const thirdGroup = thirdAssignment[winnerGroup]
    const teamId = qualifiedThirdTeamByGroup[thirdGroup]
    if (!teamId) throw new Error(`Missing qualified third-place team for group ${thirdGroup}`)
    return teamId
  }

  return [
    { matchNumber: 73, homeTeamId: groupRunnerUp('A'), awayTeamId: groupRunnerUp('B') },
    { matchNumber: 74, homeTeamId: groupWinner('E'), awayTeamId: thirdFor('E') },
    { matchNumber: 75, homeTeamId: groupWinner('F'), awayTeamId: groupRunnerUp('C') },
    { matchNumber: 76, homeTeamId: groupWinner('C'), awayTeamId: groupRunnerUp('F') },
    { matchNumber: 77, homeTeamId: groupWinner('I'), awayTeamId: thirdFor('I') },
    { matchNumber: 78, homeTeamId: groupRunnerUp('E'), awayTeamId: groupRunnerUp('I') },
    { matchNumber: 79, homeTeamId: groupWinner('A'), awayTeamId: thirdFor('A') },
    { matchNumber: 80, homeTeamId: groupWinner('L'), awayTeamId: thirdFor('L') },
    { matchNumber: 81, homeTeamId: groupWinner('D'), awayTeamId: thirdFor('D') },
    { matchNumber: 82, homeTeamId: groupWinner('G'), awayTeamId: thirdFor('G') },
    { matchNumber: 83, homeTeamId: groupRunnerUp('K'), awayTeamId: groupRunnerUp('L') },
    { matchNumber: 84, homeTeamId: groupWinner('H'), awayTeamId: groupRunnerUp('J') },
    { matchNumber: 85, homeTeamId: groupWinner('B'), awayTeamId: thirdFor('B') },
    { matchNumber: 86, homeTeamId: groupWinner('J'), awayTeamId: groupRunnerUp('H') },
    { matchNumber: 87, homeTeamId: groupWinner('K'), awayTeamId: thirdFor('K') },
    { matchNumber: 88, homeTeamId: groupRunnerUp('D'), awayTeamId: groupRunnerUp('G') },
  ]
}

function playKnockoutRound(
  pairings: Array<[number, number, number]>,
  stage: Stage,
  winnersByMatch: Map<number, string>,
  fixedByMatchNumber: Map<number, MatchRow>,
  probabilitiesByMatchNumber: Map<number, MatchProbability>,
  teamById: Map<string, TeamRow>,
  rng: () => number,
) {
  const played: PlayedMatch[] = []

  for (const [matchNumber, homeSourceMatch, awaySourceMatch] of pairings) {
    const homeTeamId = winnersByMatch.get(homeSourceMatch)
    const awayTeamId = winnersByMatch.get(awaySourceMatch)
    if (!homeTeamId || !awayTeamId) throw new Error(`Missing knockout source for match ${matchNumber}`)

    const match = simulateMatch(
      matchNumber,
      stage,
      homeTeamId,
      awayTeamId,
      fixedByMatchNumber.get(matchNumber),
      probabilitiesByMatchNumber,
      teamById,
      rng,
    )
    if (!match.winnerTeamId) throw new Error(`Knockout match ${matchNumber} has no winner`)
    winnersByMatch.set(matchNumber, match.winnerTeamId)
    played.push(match)
  }

  return played
}

function simulateTournament(
  matches: MatchRow[],
  teams: TeamRow[],
  fixedByMatchNumber: Map<number, MatchRow>,
  probabilitiesByMatchNumber: Map<number, MatchProbability>,
  teamById: Map<string, TeamRow>,
  seed: number,
) {
  const rng = mulberry32(seed)
  const played: PlayedMatch[] = []
  const winnersByMatch = new Map<number, string>()
  const eliminationRanks = new Map<string, number>()
  const groupMatches = matches
    .filter((match) => match.stage === 'Group Stage')
    .sort((a, b) => a.matchNumber - b.matchNumber)

  for (const match of groupMatches) {
    played.push(simulateMatch(
      match.matchNumber,
      'Group Stage',
      match.homeTeamId,
      match.awayTeamId,
      fixedByMatchNumber.get(match.matchNumber),
      probabilitiesByMatchNumber,
      teamById,
      rng,
    ))
  }

  const standings = groupStandings(played, teams, teamById)

  for (const group of GROUP_CODES) {
    for (const eliminated of standings[group].slice(3)) {
      eliminationRanks.set(eliminated.teamId, 33)
    }
  }

  for (const slot of buildRoundOf32(standings, teamById)) {
    const match = simulateMatch(
      slot.matchNumber,
      'Round of 32',
      slot.homeTeamId,
      slot.awayTeamId,
      fixedByMatchNumber.get(slot.matchNumber),
      probabilitiesByMatchNumber,
      teamById,
      rng,
    )
    if (!match.winnerTeamId || !match.loserTeamId) throw new Error(`Round-of-32 match ${slot.matchNumber} has no winner`)
    winnersByMatch.set(slot.matchNumber, match.winnerTeamId)
    eliminationRanks.set(match.loserTeamId, 17)
    played.push(match)
  }

  const roundOf16 = playKnockoutRound(R16_PAIRINGS, 'Round of 16', winnersByMatch, fixedByMatchNumber, probabilitiesByMatchNumber, teamById, rng)
  for (const match of roundOf16) if (match.loserTeamId) eliminationRanks.set(match.loserTeamId, 13)
  played.push(...roundOf16)

  const quarterFinals = playKnockoutRound(QF_PAIRINGS, 'Quarter-finals', winnersByMatch, fixedByMatchNumber, probabilitiesByMatchNumber, teamById, rng)
  for (const match of quarterFinals) if (match.loserTeamId) eliminationRanks.set(match.loserTeamId, 9)
  played.push(...quarterFinals)

  const semiFinals = playKnockoutRound(SF_PAIRINGS, 'Semi-finals', winnersByMatch, fixedByMatchNumber, probabilitiesByMatchNumber, teamById, rng)
  played.push(...semiFinals)

  const semiLosers = semiFinals.map((match) => match.loserTeamId).filter((teamId): teamId is string => Boolean(teamId))
  const thirdPlace = simulateMatch(103, 'Third Place Play-off', semiLosers[0], semiLosers[1], fixedByMatchNumber.get(103), probabilitiesByMatchNumber, teamById, rng)
  if (thirdPlace.winnerTeamId && thirdPlace.loserTeamId) {
    eliminationRanks.set(thirdPlace.winnerTeamId, 3)
    eliminationRanks.set(thirdPlace.loserTeamId, 4)
  }
  played.push(thirdPlace)

  const finalist1 = winnersByMatch.get(101)
  const finalist2 = winnersByMatch.get(102)
  if (!finalist1 || !finalist2) throw new Error('Missing finalists')

  const final = simulateMatch(104, 'Final', finalist1, finalist2, fixedByMatchNumber.get(104), probabilitiesByMatchNumber, teamById, rng)
  if (!final.winnerTeamId || !final.loserTeamId) throw new Error('Final has no winner')
  eliminationRanks.set(final.winnerTeamId, 1)
  eliminationRanks.set(final.loserTeamId, 2)
  played.push(final)

  return { played, eliminationRanks }
}

function playerStanding(player: PlayerRow, played: PlayedMatch[], eliminationRanks: Map<string, number>): PlayerSimStanding {
  let playedCount = 0
  let won = 0
  let drawn = 0
  let lost = 0
  let gf = 0
  let ga = 0
  let points = 0
  const owned = new Set(player.teamIds)

  for (const match of played) {
    const ownedResults: Array<{ gf: number; ga: number }> = []
    if (owned.has(match.homeTeamId)) {
      ownedResults.push({ gf: match.homeScore, ga: match.awayScore })
    }
    if (owned.has(match.awayTeamId)) {
      ownedResults.push({ gf: match.awayScore, ga: match.homeScore })
    }

    for (const { gf: teamGF, ga: teamGA } of ownedResults) {
      playedCount++
      gf += teamGF
      ga += teamGA

      if (teamGF > teamGA) {
        won++
        points += 3
      } else if (teamGF === teamGA) {
        drawn++
        points += 1
      } else {
        lost++
      }
    }
  }

  return {
    player,
    played: playedCount,
    won,
    drawn,
    lost,
    gf,
    ga,
    gd: gf - ga,
    points,
    bestRank: player.teamIds.reduce(
      (best, teamId) => Math.min(best, eliminationRanks.get(teamId) ?? Infinity),
      Infinity,
    ),
  }
}

function comparePlayerStandings(a: PlayerSimStanding, b: PlayerSimStanding) {
  if (b.points !== a.points) return b.points - a.points
  if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  if (b.won !== a.won) return b.won - a.won
  return a.player.displayName.localeCompare(b.player.displayName, 'hr', { sensitivity: 'base' })
}

function emptyProjectedStanding(): ProjectedPlayerStanding {
  return { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
}

function addProjectedStanding(total: ProjectedPlayerStanding, standing: ProjectedPlayerStanding) {
  total.played += standing.played
  total.won += standing.won
  total.drawn += standing.drawn
  total.lost += standing.lost
  total.gf += standing.gf
  total.ga += standing.ga
  total.gd += standing.gd
  total.points += standing.points
}

function averagedProjectedStanding(total: ProjectedPlayerStanding): ProjectedPlayerStanding {
  return {
    played: roundToOneDecimal(total.played / SIMULATION_COUNT),
    won: roundToOneDecimal(total.won / SIMULATION_COUNT),
    drawn: roundToOneDecimal(total.drawn / SIMULATION_COUNT),
    lost: roundToOneDecimal(total.lost / SIMULATION_COUNT),
    gf: roundToOneDecimal(total.gf / SIMULATION_COUNT),
    ga: roundToOneDecimal(total.ga / SIMULATION_COUNT),
    gd: roundToOneDecimal(total.gd / SIMULATION_COUNT),
    points: roundToOneDecimal(total.points / SIMULATION_COUNT),
  }
}

function teamStandings(played: PlayedMatch[]) {
  const standings = new Map<string, ProjectedPlayerStanding>()
  const getStanding = (teamId: string) => {
    let standing = standings.get(teamId)
    if (!standing) {
      standing = emptyProjectedStanding()
      standings.set(teamId, standing)
    }
    return standing
  }

  for (const match of played) {
    const home = getStanding(match.homeTeamId)
    const away = getStanding(match.awayTeamId)

    home.played++
    home.gf += match.homeScore
    home.ga += match.awayScore

    away.played++
    away.gf += match.awayScore
    away.ga += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.won++
      home.points += 3
      away.lost++
    } else if (match.homeScore < match.awayScore) {
      away.won++
      away.points += 3
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points += 1
      away.points += 1
    }
  }

  for (const standing of standings.values()) {
    standing.gd = standing.gf - standing.ga
  }

  return standings
}

function calculateWinningChances(
  players: PlayerRow[],
  matches: MatchRow[],
  teams: TeamRow[],
  probabilitiesByMatchNumber: Map<number, MatchProbability>,
) {
  if (players.length === 0) return []

  const teamById = new Map(teams.map((team) => [team.id, team]))
  const fixedByMatchNumber = new Map(
    matches
      .filter((match) => isFixedResult(match))
      .map((match) => [match.matchNumber, match]),
  )
  const winCounts = new Map(players.map((player) => [player.userId, 0]))
  const projectedTotals = new Map(players.map((player) => [
    player.userId,
    emptyProjectedStanding(),
  ]))
  const projectedTeamTotals = new Map(players.map((player) => [
    player.userId,
    new Map(player.teamIds.map((teamId) => [teamId, emptyProjectedStanding()])),
  ]))

  for (let index = 0; index < SIMULATION_COUNT; index++) {
    const { played, eliminationRanks } = simulateTournament(
      matches,
      teams,
      fixedByMatchNumber,
      probabilitiesByMatchNumber,
      teamById,
      20260611 + index,
    )
    const simulatedTeamStandings = teamStandings(played)
    const simStandings = players
      .map((player) => playerStanding(player, played, eliminationRanks))
      .sort(comparePlayerStandings)
    const winner = simStandings[0]

    for (const standing of simStandings) {
      const total = projectedTotals.get(standing.player.userId)
      if (!total) continue
      addProjectedStanding(total, standing)

      const playerTeamTotals = projectedTeamTotals.get(standing.player.userId)
      if (!playerTeamTotals) continue
      for (const teamId of standing.player.teamIds) {
        const teamTotal = playerTeamTotals.get(teamId)
        const teamStanding = simulatedTeamStandings.get(teamId)
        if (teamTotal && teamStanding) addProjectedStanding(teamTotal, teamStanding)
      }
    }

    winCounts.set(winner.player.userId, (winCounts.get(winner.player.userId) ?? 0) + 1)
  }

  return players
    .map((player) => {
      const wins = winCounts.get(player.userId) ?? 0
      const projectedTotal = projectedTotals.get(player.userId)
      const projectedStanding = projectedTotal ? averagedProjectedStanding(projectedTotal) : null
      const teamTotals = projectedTeamTotals.get(player.userId)
      const projectedTeams: ProjectedTeamStanding[] = teamTotals
        ? [...teamTotals.entries()].map(([teamId, total]) => ({
            teamId,
            ...averagedProjectedStanding(total),
          }))
        : []
      return {
        userId: player.userId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        wins,
        chancePercent: Math.round((wins / SIMULATION_COUNT) * 100),
        expectedPoints: projectedStanding?.points ?? 0,
        projectedStanding,
        projectedTeams,
      }
    })
    .sort((a, b) => {
      if (b.chancePercent !== a.chancePercent) return b.chancePercent - a.chancePercent
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.displayName.localeCompare(b.displayName, 'hr', { sensitivity: 'base' })
    })
}

async function apiFootballGet<T>(apiKey: string, path: string, params: Record<string, string | number>) {
  const url = new URL(`${API_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))

  const response = await fetch(url, { headers: { 'x-apisports-key': apiKey } })
  if (!response.ok) throw new Error(`API-Football ${path} returned ${response.status}`)
  return await response.json() as ApiFootballResponse<T>
}

function buildLocalTeamNameMap(teams: TeamRow[]) {
  const map = new Map<string, string>()
  for (const team of teams) {
    map.set(normalizeName(team.name), team.id)
    for (const alias of team.apiFootballAliases ?? []) map.set(normalizeName(alias), team.id)
  }
  for (const [alias, teamId] of Object.entries(API_NAME_ALIASES)) map.set(alias, teamId)
  return map
}

function toLocalTeamId(apiName: string, localTeamNameMap: Map<string, string>) {
  return localTeamNameMap.get(normalizeName(apiName)) ?? null
}

async function fetchApiFixtureMap(
  apiKey: string,
  matches: MatchRow[],
  teams: TeamRow[],
) {
  const body = await apiFootballGet<ApiFootballFixture>(apiKey, '/fixtures', {
    league: WORLD_CUP_LEAGUE_ID,
    season: WORLD_CUP_SEASON,
  })
  const localTeamNameMap = buildLocalTeamNameMap(teams)
  const localMatchesByTeams = new Map<string, MatchRow>()

  for (const match of matches) {
    localMatchesByTeams.set(`${match.homeTeamId}:${match.awayTeamId}`, match)
    localMatchesByTeams.set(`${match.awayTeamId}:${match.homeTeamId}`, match)
  }

  const fixtureMap = new Map<number, { matchNumber: number; swap: boolean }>()
  for (const fixture of body.response) {
    const homeTeamId = toLocalTeamId(fixture.teams.home.name, localTeamNameMap)
    const awayTeamId = toLocalTeamId(fixture.teams.away.name, localTeamNameMap)
    if (!homeTeamId || !awayTeamId) continue

    const match = localMatchesByTeams.get(`${homeTeamId}:${awayTeamId}`)
    if (!match) continue
    fixtureMap.set(fixture.fixture.id, {
      matchNumber: match.matchNumber,
      swap: match.homeTeamId !== homeTeamId,
    })
  }

  return { fixtureMap, requestCount: 1 }
}

function normalizeBookmakerProbabilities(values: ApiFootballOddsValue[]) {
  const getOdd = (name: string) => {
    const raw = values.find((value) => normalizeName(value.value) === name)?.odd
    const odd = raw ? Number(raw) : NaN
    return Number.isFinite(odd) && odd > 1 ? odd : null
  }

  const homeOdd = getOdd('home')
  const drawOdd = getOdd('draw')
  const awayOdd = getOdd('away')
  if (!homeOdd || !drawOdd || !awayOdd) return null

  const home = 1 / homeOdd
  const draw = 1 / drawOdd
  const away = 1 / awayOdd
  const total = home + draw + away
  if (total <= 0) return null

  return { home: home / total, draw: draw / total, away: away / total }
}

function probabilityFromOdds(entry: ApiFootballOddsFixture, swap: boolean): MatchProbability | null {
  const samples: Array<{ home: number; draw: number; away: number }> = []

  for (const bookmaker of entry.bookmakers) {
    for (const bet of bookmaker.bets) {
      if (bet.id !== MATCH_WINNER_BET_ID && normalizeName(bet.name) !== 'match winner') continue
      const sample = normalizeBookmakerProbabilities(bet.values)
      if (sample) samples.push(sample)
    }
  }

  if (samples.length === 0) return null

  const averaged = samples.reduce(
    (acc, sample) => ({
      home: acc.home + sample.home / samples.length,
      draw: acc.draw + sample.draw / samples.length,
      away: acc.away + sample.away / samples.length,
    }),
    { home: 0, draw: 0, away: 0 },
  )

  return {
    home: swap ? averaged.away : averaged.home,
    draw: averaged.draw,
    away: swap ? averaged.home : averaged.away,
    source: 'odds',
  }
}

async function fetchOddsProbabilities(
  apiKey: string,
  fixtureMap: Map<number, { matchNumber: number; swap: boolean }>,
) {
  const probabilities = new Map<number, MatchProbability>()
  let page = 1
  let totalPages = 1
  let requestCount = 0

  do {
    const body = await apiFootballGet<ApiFootballOddsFixture>(apiKey, '/odds', {
      league: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      bet: MATCH_WINNER_BET_ID,
      page,
    })
    requestCount++
    totalPages = body.paging?.total ?? 1

    for (const entry of body.response) {
      const mapped = fixtureMap.get(entry.fixture.id)
      if (!mapped) continue
      const probability = probabilityFromOdds(entry, mapped.swap)
      if (probability) probabilities.set(mapped.matchNumber, probability)
    }

    page++
  } while (page <= totalPages)

  return { probabilities, requestCount }
}

function shouldFetchOdds(matches: MatchRow[], now: Date) {
  const oddsWindowEnd = new Date(now.getTime() + ODDS_WINDOW_DAYS * MS_PER_DAY)
  return matches.some((match) =>
    match.status === 'upcoming' &&
    match.date !== null &&
    match.date >= now &&
    match.date <= oddsWindowEnd
  )
}

function fillRankFallbackProbabilities(
  matches: MatchRow[],
  teams: TeamRow[],
  probabilitiesByMatchNumber: Map<number, MatchProbability>,
) {
  const teamById = new Map(teams.map((team) => [team.id, team]))
  for (const match of matches) {
    if (isFixedResult(match) || probabilitiesByMatchNumber.has(match.matchNumber)) continue
    probabilitiesByMatchNumber.set(
      match.matchNumber,
      rankProbability(match.homeTeamId, match.awayTeamId, teamById),
    )
  }
}

function firestoreTimestampToDate(value: unknown) {
  return value instanceof admin.firestore.Timestamp ? value.toDate() : null
}

function stageFromValue(value: unknown): Stage {
  const stage = typeof value === 'string' ? value : 'Group Stage'
  if (
    stage === 'Round of 32' ||
    stage === 'Round of 16' ||
    stage === 'Quarter-finals' ||
    stage === 'Semi-finals' ||
    stage === 'Third Place Play-off' ||
    stage === 'Final'
  ) return stage
  return 'Group Stage'
}

async function loadInputs(db: admin.firestore.Firestore) {
  const [teamsSnap, matchesSnap, usersSnap, playerTeamsSnap] = await Promise.all([
    db.collection('teams').get(),
    db.collection('matches').get(),
    db.collection('users').get(),
    db.collection('playerTeams').get(),
  ])

  const teams = teamsSnap.docs
    .map((docSnap) => {
      const data = docSnap.data()
      const replacement = data.replacement as { active?: unknown } | undefined
      return {
        id: docSnap.id,
        name: (data.name as string | undefined) ?? docSnap.id,
        group: (data.group as GroupCode | undefined) ?? 'A',
        fifaRank: data.fifaRank as number | undefined,
        fifaPoints: typeof data.fifaPoints === 'number' ? data.fifaPoints : undefined,
        replacement: replacement && typeof replacement === 'object'
          ? { active: replacement.active === true }
          : undefined,
        apiFootballAliases: Array.isArray(data.apiFootballAliases)
          ? data.apiFootballAliases.filter((alias): alias is string => typeof alias === 'string')
          : [],
      }
    })
    .filter((team) => GROUP_CODES.includes(team.group))

  const matches = matchesSnap.docs
    .map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        matchNumber: data.matchNumber as number | undefined,
        stage: stageFromValue(data.stage),
        homeTeamId: data.homeTeamId as string | undefined,
        awayTeamId: data.awayTeamId as string | undefined,
        status: (data.status as string | undefined) ?? 'upcoming',
        date: firestoreTimestampToDate(data.date),
        homeScore: (data.homeScore ?? null) as number | null,
        awayScore: (data.awayScore ?? null) as number | null,
        regularTimeScoreHome: (data.regularTimeScoreHome ?? null) as number | null,
        regularTimeScoreAway: (data.regularTimeScoreAway ?? null) as number | null,
        qualifier: (data.qualifier ?? null) as 'home' | 'away' | null,
      }
    })
    .filter((match): match is MatchRow =>
      typeof match.matchNumber === 'number' &&
      match.matchNumber >= 1 &&
      match.matchNumber <= 104 &&
      typeof match.homeTeamId === 'string' &&
      typeof match.awayTeamId === 'string',
    )

  const teamIdsByUser: Record<string, string[]> = {}
  const players = usersSnap.docs.map((docSnap) => {
    const data = docSnap.data()
    teamIdsByUser[docSnap.id] = []
    return {
      userId: docSnap.id,
      displayName: (data.displayName as string | undefined) ?? '',
      avatarUrl: (data.avatarUrl as string | null | undefined) ?? null,
      teamIds: teamIdsByUser[docSnap.id],
    }
  })

  for (const playerTeamDoc of playerTeamsSnap.docs) {
    const { userId, teamId } = playerTeamDoc.data() as { userId?: string; teamId?: string }
    if (userId && teamId && teamIdsByUser[userId]) teamIdsByUser[userId].push(teamId)
  }

  return {
    teams,
    matches,
    players: players.filter((player) => player.teamIds.length > 0),
  }
}

export async function refreshWinningChances(apiKey: string | null, now = new Date()) {
  const db = admin.firestore()
  const { teams, matches, players } = await loadInputs(db)
  const probabilitiesByMatchNumber = new Map<number, MatchProbability>()
  let apiRequestsUsed = 0
  let oddsFixtureCount = 0
  let oddsStatus: 'skipped_outside_window' | 'skipped_no_key' | 'fetched' = 'skipped_outside_window'

  if (apiKey && shouldFetchOdds(matches, now)) {
    oddsStatus = 'fetched'
    const fixtureResult = await fetchApiFixtureMap(apiKey, matches, teams)
    apiRequestsUsed += fixtureResult.requestCount
    const oddsResult = await fetchOddsProbabilities(apiKey, fixtureResult.fixtureMap)
    apiRequestsUsed += oddsResult.requestCount
    oddsFixtureCount = oddsResult.probabilities.size
    for (const [matchNumber, probability] of oddsResult.probabilities) {
      probabilitiesByMatchNumber.set(matchNumber, probability)
    }
  } else if (!apiKey) {
    oddsStatus = 'skipped_no_key'
  }

  fillRankFallbackProbabilities(matches, teams, probabilitiesByMatchNumber)
  const rows = calculateWinningChances(players, matches, teams, probabilitiesByMatchNumber)
  const oddsBackedMatches = [...probabilitiesByMatchNumber.values()].filter((probability) => probability.source === 'odds').length

  await db.doc('stats/winningChances').set({
    rows,
    simulationCount: SIMULATION_COUNT,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    model: 'api-football-odds-with-fifa-points-fallback',
    oddsStatus,
    oddsFixtureCount,
    oddsBackedMatches,
    apiRequestsUsed,
  })

  console.log(
    `Winning chances refreshed: players=${players.length}, matches=${matches.length}, odds=${oddsBackedMatches}, requests=${apiRequestsUsed}, status=${oddsStatus}`,
  )

  return { rows, apiRequestsUsed, oddsStatus, oddsFixtureCount, oddsBackedMatches }
}

export const __winningChancesTest = {
  comparePlayerStandings,
  fillRankFallbackProbabilities,
  playerStanding,
  simulateTournament,
}
