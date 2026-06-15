import * as admin from 'firebase-admin'

const API_BASE = 'https://v3.football.api-sports.io'
const WORLD_CUP_LEAGUE_ID = 1
const WORLD_CUP_SEASON = 2026
const API_REQUEST_BUDGET = 3500
const MIN_LIVE_SYNC_PERIOD_SECONDS = 10
const DEFAULT_LIVE_SYNC_PERIOD_SECONDS = 60
const LIVE_SYNC_LOOP_DURATION_MS = 55 * 1000
const LIVE_SYNC_LEASE_MS = 70 * 1000
const LIVE_LOOKBACK_MINUTES = 180
const LIVE_LOOKAHEAD_MINUTES = 30
const BATCH_LIMIT = 450

interface ApiFootballFixture {
  fixture: {
    id: number
    date: string
    status: {
      short: string
      elapsed: number | null
      extra?: number | null
    }
    venue?: {
      name?: string | null
      city?: string | null
    }
  }
  league: {
    id: number
    season: number
    round: string
  }
  teams: {
    home: { id: number; name: string; winner: boolean | null }
    away: { id: number; name: string; winner: boolean | null }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

interface ApiFootballResponse<T> {
  response: T[]
}

interface PollWindow {
  startMs: number
  endMs: number
}

interface LeagueConfig {
  id: number
  season: number
  name: string
}

type SyncSkipReason = 'missing_api_key' | 'inactive_competition' | 'no_candidates' | 'throttled' | 'lease_held'

const LEAGUE_DEFAULTS = new Map<number, LeagueConfig>([
  [WORLD_CUP_LEAGUE_ID, { id: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON, name: 'FIFA World Cup' }],
])

export const API_NAME_ALIASES: Record<string, string> = {
  'bosnia herzegovina': 'bosnia-and-herzegovina',
  'bosnia and herzegovina': 'bosnia-and-herzegovina',
  'cabo verde': 'cabo-verde',
  'cape verde': 'cabo-verde',
  'cape verde islands': 'cabo-verde',
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

export interface LocalTeamRow {
  id: string
  name?: string
  apiFootballAliases?: string[]
}

interface LocalMatchRow {
  id: string
  ref: admin.firestore.DocumentReference
  homeTeamId: string
  awayTeamId: string
}

export interface LocalMatchCandidate {
  id: string
  homeTeamId: string
  awayTeamId: string
}

interface LiveSyncResult {
  skipped?: SyncSkipReason
  updated: number
  apiRequestsUsed: number
  commits?: number
  syncPeriodSeconds?: number
  syncPeriodMinutes?: number
  secondsSinceLast?: number
  throttleSecondsRemaining?: number
}

function mapStatus(short: string) {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished'
  if (['NS', 'TBD', 'PST', 'CANC', 'AWD', 'WO'].includes(short)) return 'upcoming'
  return 'live'
}

function normalizeStage(round: string) {
  if (round.startsWith('Regular Season')) return 'Regular Season'
  if (round.startsWith('Group Stage')) return 'Group Stage'
  if (round.startsWith('League Phase') || round.startsWith('League Stage')) return 'League Phase'
  if (round === '3rd Place Final') return 'Third Place Play-off'
  return round || 'Regular Season'
}

export function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()
}

function isKnockoutStage(stage: string) {
  const lower = stage.toLowerCase()
  return !lower.includes('group') && !lower.includes('regular season') && !lower.includes('league phase')
}

function intersectPollingWindow(matchDate: Date, windowStart: Date, windowEnd: Date): PollWindow | null {
  const pollStartMs = matchDate.getTime() - LIVE_LOOKAHEAD_MINUTES * 60 * 1000
  const pollEndMs = matchDate.getTime() + LIVE_LOOKBACK_MINUTES * 60 * 1000
  const startMs = Math.max(pollStartMs, windowStart.getTime())
  const endMs = Math.min(pollEndMs, windowEnd.getTime())
  return startMs < endMs ? { startMs, endMs } : null
}

function mergePollingWindows(windows: PollWindow[]) {
  if (windows.length === 0) return []

  const sorted = [...windows].sort((a, b) => a.startMs - b.startMs)
  const merged: PollWindow[] = []
  let currentStart = sorted[0].startMs
  let currentEnd = sorted[0].endMs

  for (const window of sorted.slice(1)) {
    if (window.startMs <= currentEnd) {
      currentEnd = Math.max(currentEnd, window.endMs)
    } else {
      merged.push({ startMs: currentStart, endMs: currentEnd })
      currentStart = window.startMs
      currentEnd = window.endMs
    }
  }

  merged.push({ startMs: currentStart, endMs: currentEnd })
  return merged
}

function pollingWindowSeconds(windows: PollWindow[]) {
  return windows.reduce((total, window) => total + Math.ceil((window.endMs - window.startMs) / 1000), 0)
}

function estimatedApiCalls(windows: PollWindow[], periodSeconds: number) {
  if (periodSeconds <= 0) return Number.POSITIVE_INFINITY
  return windows.reduce((total, window) => {
    const seconds = Math.ceil((window.endMs - window.startMs) / 1000)
    return total + Math.ceil(seconds / periodSeconds)
  }, 0)
}

function syncPeriodForPollingWindows(windows: PollWindow[]) {
  const mergedWindows = mergePollingWindows(windows)
  const seconds = pollingWindowSeconds(mergedWindows)
  if (seconds === 0) {
    return {
      mergedWindows,
      pollingWindowSeconds: 0,
      pollingWindowMinutes: 0,
      estimatedApiCalls: 0,
      calculatedSyncPeriodSeconds: DEFAULT_LIVE_SYNC_PERIOD_SECONDS,
      syncPeriodSeconds: DEFAULT_LIVE_SYNC_PERIOD_SECONDS,
      syncPeriodMinutes: DEFAULT_LIVE_SYNC_PERIOD_SECONDS / 60,
    }
  }

  for (let period = 1; period <= seconds; period++) {
    const calls = estimatedApiCalls(mergedWindows, period)
    if (calls <= API_REQUEST_BUDGET) {
      const syncPeriodSeconds = Math.max(period, MIN_LIVE_SYNC_PERIOD_SECONDS)
      return {
        mergedWindows,
        pollingWindowSeconds: seconds,
        pollingWindowMinutes: seconds / 60,
        estimatedApiCalls: estimatedApiCalls(mergedWindows, syncPeriodSeconds),
        calculatedSyncPeriodSeconds: period,
        syncPeriodSeconds,
        syncPeriodMinutes: syncPeriodSeconds / 60,
      }
    }
  }

  const syncPeriodSeconds = Math.max(seconds, MIN_LIVE_SYNC_PERIOD_SECONDS)
  return {
    mergedWindows,
    pollingWindowSeconds: seconds,
    pollingWindowMinutes: seconds / 60,
    estimatedApiCalls: estimatedApiCalls(mergedWindows, syncPeriodSeconds),
    calculatedSyncPeriodSeconds: seconds,
    syncPeriodSeconds,
    syncPeriodMinutes: syncPeriodSeconds / 60,
  }
}

function syncPeriodSecondsFromConfig(config: admin.firestore.DocumentData) {
  const configuredSeconds = Number(config.syncPeriodSeconds)
  if (Number.isFinite(configuredSeconds) && configuredSeconds > 0) {
    return Math.max(Math.ceil(configuredSeconds), MIN_LIVE_SYNC_PERIOD_SECONDS)
  }

  const configuredMinutes = Number(config.syncPeriodMinutes)
  if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
    return Math.max(Math.ceil(configuredMinutes * 60), MIN_LIVE_SYNC_PERIOD_SECONDS)
  }

  return DEFAULT_LIVE_SYNC_PERIOD_SECONDS
}

function scoresTied(home: number | null, away: number | null) {
  return home !== null && away !== null && home === away
}

function advancingSide(fixture: ApiFootballFixture): 'home' | 'away' | null {
  if (fixture.teams.home.winner) return 'home'
  if (fixture.teams.away.winner) return 'away'
  return null
}

function getQualifier(fixture: ApiFootballFixture, stage: string): 'home' | 'away' | null {
  if (!isKnockoutStage(stage)) return null

  const side = advancingSide(fixture)
  if (!side) return null

  const { fulltime } = fixture.score
  const regularTimeTied = scoresTied(fulltime.home, fulltime.away)
  const finalScoreTied = scoresTied(fixtureScore(fixture, 'home'), fixtureScore(fixture, 'away'))

  return regularTimeTied || finalScoreTied ? side : null
}

async function apiFootballGet<T>(apiKey: string, path: string, params: Record<string, string | number>) {
  const url = new URL(`${API_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))

  const response = await fetch(url, { headers: { 'x-apisports-key': apiKey } })
  if (!response.ok) throw new Error(`API-Football ${path} returned ${response.status}`)
  return await response.json() as ApiFootballResponse<T>
}

function normalizeWorldCupLeague(league: LeagueConfig): LeagueConfig | null {
  if (league.id !== WORLD_CUP_LEAGUE_ID) return null
  return {
    id: WORLD_CUP_LEAGUE_ID,
    season: Number.isInteger(league.season) ? league.season : WORLD_CUP_SEASON,
    name: league.name || 'FIFA World Cup',
  }
}

function onlyWorldCupLeagues(leagues: LeagueConfig[]) {
  return leagues
    .map(normalizeWorldCupLeague)
    .filter((league): league is LeagueConfig => league !== null)
}

function activeLeagueIds(config: admin.firestore.DocumentData) {
  return activeLeagueConfigs(config).map((league) => league.id)
}

function activeLeagueConfigs(config: admin.firestore.DocumentData): LeagueConfig[] {
  const leagues = config.activeLeagues
  if (Array.isArray(leagues)) {
    return onlyWorldCupLeagues(leagues
      .map((league) => {
        const id = Number(league?.id)
        const season = Number(league?.season)
        if (!Number.isInteger(id) || !Number.isInteger(season)) return null
        return {
          id,
          season,
          name: typeof league?.name === 'string' && league.name.trim()
            ? league.name.trim()
            : LEAGUE_DEFAULTS.get(id)?.name ?? String(id),
        }
      })
      .filter((league): league is LeagueConfig => league !== null))
  }

  const ids = config.activeLeagueIds
  if (Array.isArray(ids)) {
    return onlyWorldCupLeagues(ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id))
      .map((id) => {
        const configuredSeason = Number(config.activeLeagueSeasons?.[String(id)])
        const fallback = LEAGUE_DEFAULTS.get(id)
        return {
          id,
          season: Number.isInteger(configuredSeason) ? configuredSeason : fallback?.season ?? new Date().getUTCFullYear(),
          name: fallback?.name ?? String(id),
        }
      }))
  }

  const id = Number(config.activeLeagueId)
  if (Number.isInteger(id)) {
    const configuredSeason = Number(config.activeLeagueSeason)
    const fallback = LEAGUE_DEFAULTS.get(id)
    return onlyWorldCupLeagues([{
      id,
      season: Number.isInteger(configuredSeason) ? configuredSeason : fallback?.season ?? new Date().getUTCFullYear(),
      name: fallback?.name ?? String(id),
    }])
  }
  if (config.competitionMode === 'world_cup_2026') return [LEAGUE_DEFAULTS.get(WORLD_CUP_LEAGUE_ID)!]
  return []
}

function fixtureScore(fixture: ApiFootballFixture, side: 'home' | 'away') {
  return fixture.goals[side] ?? fixture.score.fulltime[side]
}

function fixtureToMatchPatch(
  fixture: ApiFootballFixture,
  localTeams?: { homeTeamId: string; awayTeamId: string },
) {
  const status = mapStatus(fixture.fixture.status.short)
  const isExtraTimeFinal = ['AET', 'PEN'].includes(fixture.fixture.status.short)
  const fulltimeHome = fixture.score.fulltime.home
  const fulltimeAway = fixture.score.fulltime.away
  const stage = normalizeStage(fixture.league.round)

  return {
    homeTeamId: localTeams?.homeTeamId ?? String(fixture.teams.home.id),
    awayTeamId: localTeams?.awayTeamId ?? String(fixture.teams.away.id),
    date: admin.firestore.Timestamp.fromDate(new Date(fixture.fixture.date)),
    venue: fixture.fixture.venue?.name ?? fixture.fixture.venue?.city ?? '',
    stage,
    status,
    homeScore: fixtureScore(fixture, 'home'),
    awayScore: fixtureScore(fixture, 'away'),
    qualifier: getQualifier(fixture, stage),
    minute: status === 'live' ? fixture.fixture.status.elapsed : null,
    stoppageTime: status === 'live' ? fixture.fixture.status.extra ?? null : null,
    statusShort: status === 'live' ? fixture.fixture.status.short : null,
    apiFootballFixtureId: fixture.fixture.id,
    leagueId: fixture.league.id,
    season: fixture.league.season,
    source: `API-Football league ${fixture.league.id} season ${fixture.league.season}`,
    ...(isExtraTimeFinal && fulltimeHome !== null && fulltimeAway !== null ? {
      regularTimeScoreHome: fulltimeHome,
      regularTimeScoreAway: fulltimeAway,
    } : {}),
  }
}

async function writeFixturePatches(
  fixtures: ApiFootballFixture[],
  matchesByFixtureId: Map<number, LocalMatchRow>,
) {
  const db = admin.firestore()
  let batch = db.batch()
  let count = 0
  let commits = 0
  let updated = 0

  async function commitIfNeeded(force = false) {
    if (count === 0 || (!force && count < BATCH_LIMIT)) return
    await batch.commit()
    batch = db.batch()
    count = 0
    commits++
  }

  for (const fixture of fixtures) {
    const match = matchesByFixtureId.get(fixture.fixture.id)
    if (!match) continue

    batch.set(
      match.ref,
      fixtureToMatchPatch(fixture, {
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
      }),
      { merge: true },
    )
    count++
    updated++
    await commitIfNeeded()
  }

  await commitIfNeeded(true)
  return { commits, updated }
}

async function loadLocalTeams(db: admin.firestore.Firestore): Promise<LocalTeamRow[]> {
  const snap = await db.collection('teams').get()
  return snap.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      name: typeof data.name === 'string' ? data.name : undefined,
      apiFootballAliases: Array.isArray(data.apiFootballAliases)
        ? data.apiFootballAliases.filter((alias): alias is string => typeof alias === 'string')
        : [],
    }
  })
}

async function loadLocalMatches(db: admin.firestore.Firestore): Promise<LocalMatchRow[]> {
  const snap = await db.collection('matches').get()
  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data()
      const homeTeamId = typeof data.homeTeamId === 'string' ? data.homeTeamId : null
      const awayTeamId = typeof data.awayTeamId === 'string' ? data.awayTeamId : null
      if (!homeTeamId || !awayTeamId) return null
      return {
        id: docSnap.id,
        ref: docSnap.ref,
        homeTeamId,
        awayTeamId,
      }
    })
    .filter((match): match is LocalMatchRow => match !== null)
}

export function buildLocalTeamNameMap(teams: LocalTeamRow[]) {
  const map = new Map<string, string>()
  for (const team of teams) {
    if (team.name) map.set(normalizeName(team.name), team.id)
    for (const alias of team.apiFootballAliases ?? []) map.set(normalizeName(alias), team.id)
  }
  for (const [alias, teamId] of Object.entries(API_NAME_ALIASES)) map.set(alias, teamId)
  return map
}

export function toLocalTeamId(apiTeamName: string, teamNameMap: Map<string, string>) {
  return teamNameMap.get(normalizeName(apiTeamName)) ?? null
}

function buildLocalMatchesByTeams<T extends { homeTeamId: string; awayTeamId: string }>(matches: T[]) {
  const map = new Map<string, T>()
  for (const match of matches) {
    map.set(`${match.homeTeamId}:${match.awayTeamId}`, match)
    map.set(`${match.awayTeamId}:${match.homeTeamId}`, match)
  }
  return map
}

function mapFixtureToLocalMatch<T extends LocalMatchCandidate>(
  fixture: ApiFootballFixture,
  teamNameMap: Map<string, string>,
  matchesByTeams: Map<string, T>,
) {
  const homeTeamId = toLocalTeamId(fixture.teams.home.name, teamNameMap)
  const awayTeamId = toLocalTeamId(fixture.teams.away.name, teamNameMap)
  if (!homeTeamId || !awayTeamId) return null
  return matchesByTeams.get(`${homeTeamId}:${awayTeamId}`) ?? null
}

export function previewLocalFixtureMatch(
  fixture: ApiFootballFixture,
  teams: LocalTeamRow[],
  matches: LocalMatchCandidate[],
) {
  const match = mapFixtureToLocalMatch(
    fixture,
    buildLocalTeamNameMap(teams),
    buildLocalMatchesByTeams(matches),
  )
  if (!match) return null

  return {
    matchId: match.id,
    patch: fixtureToMatchPatch(fixture, {
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
    }),
  }
}

export async function syncWorldCupFixtureCatalog(apiKey: string | null) {
  if (!apiKey) return { skipped: 'missing_api_key' as SyncSkipReason, fixtures: 0, apiRequestsUsed: 0 }

  const db = admin.firestore()
  const configSnap = await db.doc('config/app').get()
  const config = configSnap.data() ?? {}
  const leagues = activeLeagueConfigs(config)
  if (leagues.length === 0) {
    return { skipped: 'inactive_competition' as SyncSkipReason, fixtures: 0, apiRequestsUsed: 0 }
  }

  let fixtures = 0
  let commits = 0
  let apiRequestsUsed = 0
  let unmappedFixtures = 0

  const [localTeams, localMatches] = await Promise.all([
    loadLocalTeams(db),
    loadLocalMatches(db),
  ])
  const teamNameMap = buildLocalTeamNameMap(localTeams)
  const matchesByTeams = buildLocalMatchesByTeams(localMatches)

  for (const league of leagues) {
    const body = await apiFootballGet<ApiFootballFixture>(apiKey, '/fixtures', {
      league: league.id,
      season: league.season,
    })
    apiRequestsUsed++

    const matchesByFixtureId = new Map<number, LocalMatchRow>()
    const mappedFixtures: ApiFootballFixture[] = []
    for (const fixture of body.response) {
      const match = mapFixtureToLocalMatch(fixture, teamNameMap, matchesByTeams)
      if (!match) {
        unmappedFixtures++
        continue
      }

      matchesByFixtureId.set(fixture.fixture.id, match)
      mappedFixtures.push(fixture)
    }

    const result = await writeFixturePatches(mappedFixtures, matchesByFixtureId)
    commits += result.commits
    fixtures += result.updated

    console.log(`[${league.name}] Synced ${result.updated}/${body.response.length} mapped fixtures`)
  }

  await db.doc('config/app').set({
    lastFixtureCatalogSyncAt: admin.firestore.FieldValue.serverTimestamp(),
    lastFixtureCatalogSyncLeagueIds: leagues.map((league) => league.id),
    lastFixtureCatalogSyncSelectedTeamCount: null,
    lastFixtureCatalogSyncUnmappedFixtureCount: unmappedFixtures,
  }, { merge: true })

  console.log(`Fixture catalog sync: ${fixtures} fixtures in ${commits} batch(es)`)
  return { fixtures, apiRequestsUsed, commits, unmappedFixtures }
}


export async function calculateSyncPeriod(now = new Date()) {
  const db = admin.firestore()
  const configSnap = await db.doc('config/app').get()
  const config = configSnap.data() ?? {}
  const leagueIds = activeLeagueIds(config)

  if (leagueIds.length === 0) {
    return {
      skipped: 'inactive_competition' as SyncSkipReason,
      regularMatches: 0,
      knockoutMatches: 0,
      pollingWindowSeconds: 0,
      pollingWindowMinutes: 0,
      estimatedApiCalls: 0,
      syncPeriodSeconds: DEFAULT_LIVE_SYNC_PERIOD_SECONDS,
      syncPeriodMinutes: DEFAULT_LIVE_SYNC_PERIOD_SECONDS / 60,
    }
  }

  const windowStart = now
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const queryStart = new Date(windowStart.getTime() - LIVE_LOOKBACK_MINUTES * 60 * 1000)
  const queryEnd = new Date(windowEnd.getTime() + LIVE_LOOKAHEAD_MINUTES * 60 * 1000)
  const matchesSnap = await db.collection('matches')
    .where('date', '>=', admin.firestore.Timestamp.fromDate(queryStart))
    .where('date', '<', admin.firestore.Timestamp.fromDate(queryEnd))
    .get()

  let regularMatches = 0
  let knockoutMatches = 0
  const pollingWindows: PollWindow[] = []

  for (const docSnap of matchesSnap.docs) {
    const data = docSnap.data()
    if (!leagueIds.includes(Number(data.leagueId))) continue
    if (data.status === 'finished') continue

    const date = data.date instanceof admin.firestore.Timestamp ? data.date.toDate() : null
    if (!date) continue
    const pollingWindow = intersectPollingWindow(date, windowStart, windowEnd)
    if (!pollingWindow) continue
    pollingWindows.push(pollingWindow)

    const stage = typeof data.stage === 'string' ? data.stage : 'Regular Season'
    if (isKnockoutStage(stage)) knockoutMatches++
    else regularMatches++
  }

  const syncPeriod = syncPeriodForPollingWindows(pollingWindows)

  await db.doc('config/app').set({
    syncPeriodSeconds: syncPeriod.syncPeriodSeconds,
    syncPeriodMinutes: syncPeriod.syncPeriodMinutes,
    syncPeriodUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    syncPeriodWindowStart: admin.firestore.Timestamp.fromDate(windowStart),
    syncPeriodWindowEnd: admin.firestore.Timestamp.fromDate(windowEnd),
    syncPeriodRegularMatches: regularMatches,
    syncPeriodKnockoutMatches: knockoutMatches,
    syncPeriodPollingWindowSeconds: syncPeriod.pollingWindowSeconds,
    syncPeriodPollingWindowMinutes: syncPeriod.pollingWindowMinutes,
    syncPeriodPollingWindowCount: pollingWindows.length,
    syncPeriodMergedWindowCount: syncPeriod.mergedWindows.length,
    syncPeriodEstimatedApiCalls: syncPeriod.estimatedApiCalls,
    syncPeriodRequestBudget: API_REQUEST_BUDGET,
    syncPeriodMinimumSeconds: MIN_LIVE_SYNC_PERIOD_SECONDS,
    syncPeriodCalculatedSeconds: syncPeriod.calculatedSyncPeriodSeconds,
  }, { merge: true })

  console.log(
    `Sync period: regular=${regularMatches}, knockout=${knockoutMatches}, pollSeconds=${syncPeriod.pollingWindowSeconds}, estimatedCalls=${syncPeriod.estimatedApiCalls}, period=${syncPeriod.syncPeriodSeconds}s`,
  )

  return {
    regularMatches,
    knockoutMatches,
    pollingWindowSeconds: syncPeriod.pollingWindowSeconds,
    pollingWindowMinutes: syncPeriod.pollingWindowMinutes,
    estimatedApiCalls: syncPeriod.estimatedApiCalls,
    syncPeriodSeconds: syncPeriod.syncPeriodSeconds,
    syncPeriodMinutes: syncPeriod.syncPeriodMinutes,
  }
}

function fixtureIdFromMatch(docSnap: admin.firestore.QueryDocumentSnapshot) {
  const data = docSnap.data()
  const id = Number(data.apiFootballFixtureId ?? docSnap.id)
  return Number.isInteger(id) ? id : null
}

export async function syncLiveFixtures(apiKey: string | null, now = new Date()): Promise<LiveSyncResult> {
  if (!apiKey) return { skipped: 'missing_api_key' as SyncSkipReason, updated: 0, apiRequestsUsed: 0 }

  const db = admin.firestore()
  const configSnap = await db.doc('config/app').get()
  const config = configSnap.data() ?? {}
  const leagueIds = activeLeagueIds(config)
  if (leagueIds.length === 0) {
    return { skipped: 'inactive_competition' as SyncSkipReason, updated: 0, apiRequestsUsed: 0 }
  }

  const syncPeriodSeconds = syncPeriodSecondsFromConfig(config)
  const lastSyncAt = config.lastLiveSyncAt
  if (lastSyncAt instanceof admin.firestore.Timestamp) {
    const secondsSinceLast = (now.getTime() - lastSyncAt.toDate().getTime()) / 1000
    if (secondsSinceLast < syncPeriodSeconds) {
      const throttleSecondsRemaining = Math.ceil(syncPeriodSeconds - secondsSinceLast)
      console.log(`Throttled: ${secondsSinceLast.toFixed(1)}s since last live sync, period=${syncPeriodSeconds}s`)
      return {
        skipped: 'throttled' as SyncSkipReason,
        updated: 0,
        apiRequestsUsed: 0,
        syncPeriodSeconds,
        syncPeriodMinutes: syncPeriodSeconds / 60,
        secondsSinceLast,
        throttleSecondsRemaining,
      }
    }
  }

  const windowStart = new Date(now.getTime() - LIVE_LOOKBACK_MINUTES * 60 * 1000)
  const windowEnd = new Date(now.getTime() + LIVE_LOOKAHEAD_MINUTES * 60 * 1000)
  const candidatesSnap = await db.collection('matches')
    .where('date', '>=', admin.firestore.Timestamp.fromDate(windowStart))
    .where('date', '<=', admin.firestore.Timestamp.fromDate(windowEnd))
    .get()

  const matchesByFixtureId = new Map<number, LocalMatchRow>()
  const fixtureIds: number[] = []

  for (const docSnap of candidatesSnap.docs) {
    const data = docSnap.data()
    if (data.status === 'finished' || !leagueIds.includes(Number(data.leagueId))) continue

    const fixtureId = fixtureIdFromMatch(docSnap)
    const homeTeamId = typeof data.homeTeamId === 'string' ? data.homeTeamId : null
    const awayTeamId = typeof data.awayTeamId === 'string' ? data.awayTeamId : null
    if (fixtureId === null || !homeTeamId || !awayTeamId) continue

    fixtureIds.push(fixtureId)
    matchesByFixtureId.set(fixtureId, {
      id: docSnap.id,
      ref: docSnap.ref,
      homeTeamId,
      awayTeamId,
    })
  }

  if (fixtureIds.length === 0) {
    return {
      skipped: 'no_candidates' as SyncSkipReason,
      updated: 0,
      apiRequestsUsed: 0,
      syncPeriodSeconds,
      syncPeriodMinutes: syncPeriodSeconds / 60,
    }
  }

  const body = await apiFootballGet<ApiFootballFixture>(apiKey, '/fixtures', {
    ids: Array.from(new Set(fixtureIds)).join('-'),
  })
  const result = await writeFixturePatches(body.response, matchesByFixtureId)

  await db.doc('config/app').set({
    lastLiveSyncAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLiveSyncFixtureCount: result.updated,
  }, { merge: true })

  console.log(`Live sync: ${result.updated}/${body.response.length} fixture(s), ${result.commits} batch(es), period=${syncPeriodSeconds}s`)
  return {
    updated: result.updated,
    apiRequestsUsed: 1,
    commits: result.commits,
    syncPeriodSeconds,
    syncPeriodMinutes: syncPeriodSeconds / 60,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function acquireLiveSyncLease(db: admin.firestore.Firestore, ownerId: string, now: Date) {
  const leaseRef = db.doc('config/liveSyncLease')
  const leaseExpiresAt = admin.firestore.Timestamp.fromDate(new Date(now.getTime() + LIVE_SYNC_LEASE_MS))

  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(leaseRef)
    const expiresAt = snap.data()?.expiresAt

    if (expiresAt instanceof admin.firestore.Timestamp && expiresAt.toDate().getTime() > now.getTime()) {
      return false
    }

    transaction.set(leaseRef, {
      ownerId,
      acquiredAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: leaseExpiresAt,
    }, { merge: true })
    return true
  })
}

async function releaseLiveSyncLease(db: admin.firestore.Firestore, ownerId: string) {
  const leaseRef = db.doc('config/liveSyncLease')

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(leaseRef)
    if (snap.data()?.ownerId !== ownerId) return

    transaction.set(leaseRef, {
      expiresAt: admin.firestore.Timestamp.fromDate(new Date()),
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
  })
}

export async function syncLiveFixturesLoop(apiKey: string | null, now = new Date()) {
  if (!apiKey) return { skipped: 'missing_api_key' as SyncSkipReason, updated: 0, apiRequestsUsed: 0, attempts: 0 }

  const db = admin.firestore()
  const ownerId = `${now.getTime()}-${Math.random().toString(36).slice(2)}`
  const acquired = await acquireLiveSyncLease(db, ownerId, now)
  if (!acquired) return { skipped: 'lease_held' as SyncSkipReason, updated: 0, apiRequestsUsed: 0, attempts: 0 }

  const deadlineMs = now.getTime() + LIVE_SYNC_LOOP_DURATION_MS
  let attempts = 0
  let updated = 0
  let apiRequestsUsed = 0
  let commits = 0
  let syncPeriodSeconds = DEFAULT_LIVE_SYNC_PERIOD_SECONDS
  let lastSkipped: SyncSkipReason | null = null

  try {
    while (Date.now() < deadlineMs) {
      const result = await syncLiveFixtures(apiKey, new Date())
      attempts += 1
      updated += result.updated
      apiRequestsUsed += result.apiRequestsUsed
      commits += result.commits ?? 0
      syncPeriodSeconds = result.syncPeriodSeconds ?? syncPeriodSeconds
      lastSkipped = result.skipped ?? null

      if (result.skipped && result.skipped !== 'throttled') break

      const sleepSeconds = result.skipped === 'throttled'
        ? result.throttleSecondsRemaining ?? syncPeriodSeconds
        : syncPeriodSeconds
      const sleepMs = Math.max(1000, sleepSeconds * 1000)
      const remainingMs = deadlineMs - Date.now()
      if (remainingMs <= sleepMs) break

      await sleep(sleepMs)
    }

    if (apiRequestsUsed > 0 || lastSkipped === 'throttled') {
      await db.doc('config/app').set({
        lastLiveSyncLoopAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLiveSyncLoopAttempts: attempts,
        lastLiveSyncLoopApiRequestsUsed: apiRequestsUsed,
        lastLiveSyncLoopUpdated: updated,
        lastLiveSyncLoopSkipped: lastSkipped,
        lastLiveSyncLoopPeriodSeconds: syncPeriodSeconds,
      }, { merge: true })
    }

    return {
      updated,
      apiRequestsUsed,
      commits,
      attempts,
      syncPeriodSeconds,
      syncPeriodMinutes: syncPeriodSeconds / 60,
      ...(lastSkipped ? { skipped: lastSkipped } : {}),
    }
  } finally {
    await releaseLiveSyncLease(db, ownerId)
  }
}

export const __syncTest = {
  getQualifier,
}
