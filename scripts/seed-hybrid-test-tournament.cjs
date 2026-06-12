// Seeds a hybrid MLS + EPL test tournament using the normal list/draw/prediction flow.
//
// Draw pool:
//   - 10 selected MLS teams
//   - 10 selected EPL teams
//
// Match pool:
//   - API-Football fixtures from both leagues where at least one selected team plays.
//   - Opponents outside the draw pool are seeded as non-draw-eligible teams, so
//     users can predict those matches but no one earns owner standings points for
//     the unowned side.
//
// Dry run:
//   API_FOOTBALL_KEY=... FIREBASE_PROJECT_ID=... node scripts/seed-hybrid-test-tournament.cjs --dry-run
//
// Real seed:
//   API_FOOTBALL_KEY=... FIREBASE_PROJECT_ID=... node scripts/seed-hybrid-test-tournament.cjs --confirm
//
// Verify Firestore:
//   FIREBASE_PROJECT_ID=... node scripts/seed-hybrid-test-tournament.cjs --verify

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
const API_HOST = 'v3.football.api-sports.io'
const API_REQUEST_BUDGET = 3500
const MIN_LIVE_SYNC_PERIOD_SECONDS = 10
const DEFAULT_LIVE_SYNC_PERIOD_SECONDS = 60
const LIVE_LOOKBACK_MINUTES = 180
const LIVE_LOOKAHEAD_MINUTES = 30

const COMPETITION_MODE = 'hybrid_test'
const COMPETITION_NAME = 'Hybrid MLS/EPL Test'
const DRAW_SNAPSHOT = 'Hybrid test pool: 10 MLS teams + 10 EPL teams'

const LEAGUES = [
  { id: 253, season: 2026, name: 'MLS', seasonLabel: '2026' },
  { id: 39, season: 2025, name: 'EPL', seasonLabel: '2025/2026' },
]

const SELECTED_TEAMS = [
  { leagueId: 253, label: 'LA Galaxy', aliases: ['LA Galaxy', 'Los Angeles Galaxy', 'Los Angeles Galaxy FC'] },
  { leagueId: 253, label: 'Seattle', aliases: ['Seattle', 'Seattle Sounders', 'Seattle Sounders FC'] },
  { leagueId: 253, label: 'Colorado', aliases: ['Colorado', 'Colorado Rapids'] },
  { leagueId: 253, label: 'Dallas', aliases: ['Dallas', 'FC Dallas'] },
  { leagueId: 253, label: 'Austin', aliases: ['Austin', 'Austin FC'] },
  { leagueId: 253, label: 'Chicago', aliases: ['Chicago', 'Chicago Fire', 'Chicago Fire FC'] },
  { leagueId: 253, label: 'Nashville', aliases: ['Nashville', 'Nashville SC'] },
  { leagueId: 253, label: 'DC United', aliases: ['DC United', 'D.C. United'] },
  { leagueId: 253, label: 'NY City', aliases: ['NY City', 'New York City FC', 'New York City'] },
  { leagueId: 253, label: 'New England', aliases: ['New England', 'New England Revolution'] },
  { leagueId: 39, label: 'Arsenal', aliases: ['Arsenal'] },
  { leagueId: 39, label: 'Liverpool', aliases: ['Liverpool'] },
  { leagueId: 39, label: 'Man Utd', aliases: ['Man Utd', 'Manchester United', 'Manchester Utd'] },
  { leagueId: 39, label: 'Newcastle', aliases: ['Newcastle', 'Newcastle United'] },
  { leagueId: 39, label: 'Chelsea', aliases: ['Chelsea'] },
  { leagueId: 39, label: 'Man City', aliases: ['Man City', 'Manchester City'] },
  { leagueId: 39, label: 'Aston Villa', aliases: ['Aston Villa'] },
  { leagueId: 39, label: 'Everton', aliases: ['Everton'] },
  { leagueId: 39, label: 'West Ham', aliases: ['West Ham', 'West Ham United'] },
  { leagueId: 39, label: 'Leeds', aliases: ['Leeds', 'Leeds United'] },
]

const RESET_COLLECTIONS = [
  'teams',
  'matches',
  'predictions',
  'playerTeams',
  'teamLists',
  'teamListStatuses',
  'teamReplacementHistory',
]

const RESET_DOCS = [
  'draw/state',
  'stats/winningChances',
  'config/liveSyncLease',
]

function usageAndExit() {
  console.error('Usage: node scripts/seed-hybrid-test-tournament.cjs --dry-run | --confirm | --verify')
  process.exit(1)
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const key = match[1]
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function getApiFootballKey() {
  loadEnvFile(path.join(process.cwd(), '.env.local'))
  loadEnvFile(path.join(process.cwd(), 'functions', `.env.${PROJECT_ID}`))
  const key = process.env.API_FOOTBALL_KEY || process.env.API_SPORTS_KEY
  if (!key) throw new Error('Set API_FOOTBALL_KEY before running the hybrid seed.')
  return key
}

function getStoredRefreshToken() {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json')
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const token = data.tokens && data.tokens.refresh_token
  if (!token) throw new Error(`No Firebase CLI refresh token found at ${configPath}`)
  return token
}

function request(method, hostname, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname,
      path: urlPath,
      method,
      headers: {
        ...headers,
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let bodyOut = data
        try {
          bodyOut = data ? JSON.parse(data) : {}
        } catch {
          // Keep raw body for diagnostics.
        }
        resolve({ status: res.statusCode, body: bodyOut })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function requestForm(hostname, urlPath, form) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams(form).toString()
    const opts = {
      hostname,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let bodyOut = data
        try {
          bodyOut = data ? JSON.parse(data) : {}
        } catch {
          // Keep raw body for diagnostics.
        }
        resolve({ status: res.statusCode, body: bodyOut })
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function getToken() {
  const refreshToken = getStoredRefreshToken()
  const res = await requestForm('www.googleapis.com', '/oauth2/v3/token', {
    refresh_token: refreshToken,
    client_id: FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  })

  if (res.status < 200 || res.status >= 300 || typeof res.body.access_token !== 'string') {
    throw new Error(`Failed to refresh Firebase CLI token: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }

  return res.body.access_token
}

async function apiGet(pathPart, params, apiKey) {
  const qs = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))
  const res = await request('GET', API_HOST, `${pathPart}?${qs.toString()}`, null, {
    'x-apisports-key': apiKey,
  })
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`API-Football ${pathPart} failed: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body
}

function valueToFirestore(value) {
  if (value === null) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) }
  if (typeof value === 'number') return { doubleValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(valueToFirestore) } }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, valueToFirestore(nestedValue)]),
        ),
      },
    }
  }
  throw new Error(`Unsupported Firestore value: ${value}`)
}

function fieldsFromObject(input) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, valueToFirestore(value)]))
}

function firestoreValueToJs(value) {
  if (!value) return undefined
  if ('nullValue' in value) return null
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('stringValue' in value) return value.stringValue
  if ('timestampValue' in value) return value.timestampValue
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(firestoreValueToJs)
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([key, nestedValue]) => [key, firestoreValueToJs(nestedValue)]),
    )
  }
  return undefined
}

function firestoreFieldsToJs(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, firestoreValueToJs(value)]),
  )
}

async function patchDocument(pathPart, data, token) {
  const updateMask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&')
  const res = await request(
    'PATCH',
    'firestore.googleapis.com',
    `${BASE}/${pathPart}?${updateMask}`,
    { fields: fieldsFromObject(data) },
    { Authorization: `Bearer ${token}` },
  )
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to write ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

async function deleteDocument(pathPart, token) {
  const res = await request('DELETE', 'firestore.googleapis.com', `${BASE}/${pathPart}`, null, {
    Authorization: `Bearer ${token}`,
  })
  if (res.status !== 200 && res.status !== 404) {
    throw new Error(`Failed to delete ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

async function listCollection(collectionId, token) {
  const docs = []
  let nextPageToken = null

  do {
    const qs = new URLSearchParams({ pageSize: '300' })
    if (nextPageToken) qs.set('pageToken', nextPageToken)
    const res = await request('GET', 'firestore.googleapis.com', `${BASE}/${collectionId}?${qs.toString()}`, null, {
      Authorization: `Bearer ${token}`,
    })
    if (res.status === 404) return docs
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to list ${collectionId}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }
    for (const doc of res.body.documents ?? []) {
      docs.push({
        ...firestoreFieldsToJs(doc.fields),
        id: doc.name.split('/').pop(),
        docName: doc.name,
      })
    }
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return docs
}

async function deleteCollection(collectionId, token) {
  const docs = await listCollection(collectionId, token)
  for (const doc of docs) {
    const res = await request('DELETE', 'firestore.googleapis.com', `/v1/${doc.docName}`, null, {
      Authorization: `Bearer ${token}`,
    })
    if (res.status !== 200) {
      throw new Error(`Failed to delete ${doc.docName}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }
  }
  return docs.length
}

async function getDocument(pathPart, token) {
  const res = await request('GET', 'firestore.googleapis.com', `${BASE}/${pathPart}`, null, {
    Authorization: `Bearer ${token}`,
  })
  if (res.status === 404) return null
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to read ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
  return firestoreFieldsToJs(res.body.fields)
}

function normalizeName(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()
}

function mapStatus(short) {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished'
  if (['NS', 'TBD', 'PST', 'CANC', 'AWD', 'WO'].includes(short)) return 'upcoming'
  return 'live'
}

function normalizeStage(round) {
  if (!round) return 'Regular Season'
  if (round.startsWith('Regular Season')) return 'Regular Season'
  if (round.startsWith('Group Stage')) return 'Group Stage'
  if (round.startsWith('League Phase') || round.startsWith('League Stage')) return 'League Phase'
  if (round === '3rd Place Final') return 'Third Place Play-off'
  return round
}

function isKnockoutStage(stage) {
  const lower = stage.toLowerCase()
  return !lower.includes('group') && !lower.includes('regular season') && !lower.includes('league phase')
}

function intersectPollingWindow(matchDate, windowStart, windowEnd) {
  const pollStartMs = matchDate.getTime() - LIVE_LOOKAHEAD_MINUTES * 60 * 1000
  const pollEndMs = matchDate.getTime() + LIVE_LOOKBACK_MINUTES * 60 * 1000
  const startMs = Math.max(pollStartMs, windowStart.getTime())
  const endMs = Math.min(pollEndMs, windowEnd.getTime())
  return startMs < endMs ? { startMs, endMs } : null
}

function mergePollingWindows(windows) {
  if (windows.length === 0) return []

  const sorted = [...windows].sort((a, b) => a.startMs - b.startMs)
  const merged = []
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

function pollingWindowSeconds(windows) {
  return windows.reduce((total, window) => total + Math.ceil((window.endMs - window.startMs) / 1000), 0)
}

function estimatedApiCalls(windows, periodSeconds) {
  if (periodSeconds <= 0) return Number.POSITIVE_INFINITY
  return windows.reduce((total, window) => {
    const seconds = Math.ceil((window.endMs - window.startMs) / 1000)
    return total + Math.ceil(seconds / periodSeconds)
  }, 0)
}

function syncPeriodForPollingWindows(windows) {
  const mergedWindows = mergePollingWindows(windows)
  const seconds = pollingWindowSeconds(mergedWindows)
  if (seconds === 0) {
    return {
      mergedWindowCount: 0,
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
        mergedWindowCount: mergedWindows.length,
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
    mergedWindowCount: mergedWindows.length,
    pollingWindowSeconds: seconds,
    pollingWindowMinutes: seconds / 60,
    estimatedApiCalls: estimatedApiCalls(mergedWindows, syncPeriodSeconds),
    calculatedSyncPeriodSeconds: seconds,
    syncPeriodSeconds,
    syncPeriodMinutes: syncPeriodSeconds / 60,
  }
}

function fixtureScore(fixture, side) {
  return fixture.goals[side] ?? fixture.score.fulltime[side]
}

function scoresTied(home, away) {
  return home !== null && away !== null && home === away
}

function advancingSide(fixture) {
  if (fixture.teams.home.winner) return 'home'
  if (fixture.teams.away.winner) return 'away'
  return null
}

function getQualifier(fixture, stage) {
  if (!isKnockoutStage(stage)) return null
  const side = advancingSide(fixture)
  if (!side) return null

  const fulltime = fixture.score.fulltime
  const regularTimeTied = scoresTied(fulltime.home, fulltime.away)
  const finalScoreTied = scoresTied(fixtureScore(fixture, 'home'), fixtureScore(fixture, 'away'))
  return regularTimeTied || finalScoreTied ? side : null
}

function selectedConfigForTeam(team, leagueId) {
  const normalized = normalizeName(team.name)
  return SELECTED_TEAMS.find((selected) =>
    selected.leagueId === leagueId
    && selected.aliases.some((alias) => normalizeName(alias) === normalized),
  ) ?? null
}

function buildTeams(leagueRows) {
  const teams = []
  const selectedTeams = []
  const seenSelectedLabels = new Set()

  for (const { league, teamsBody } of leagueRows) {
    const apiTeams = (teamsBody.response ?? [])
      .map((entry) => entry.team)
      .filter((team) => team?.id && team?.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

    for (const team of apiTeams) {
      const selected = selectedConfigForTeam(team, league.id)
      const selectedIndex = selected ? SELECTED_TEAMS.indexOf(selected) : -1
      const aliases = [
        team.name,
        team.code,
        ...(selected?.aliases ?? []),
      ].filter((value) => typeof value === 'string' && value.trim())
      const row = {
        id: String(team.id),
        name: team.name,
        flag: team.code || league.name,
        group: league.name,
        confederation: league.name,
        drawEligible: Boolean(selected),
        drawSeedOrder: selected ? selectedIndex + 1 : 999 + teams.length,
        fifaRank: selected ? selectedIndex + 1 : 999 + teams.length,
        fifaRankingSnapshot: new Date().toISOString().slice(0, 10),
        apiFootballTeamId: team.id,
        apiFootballAliases: Array.from(new Set(aliases)),
        leagueId: league.id,
        season: league.season,
      }

      teams.push(row)
      if (selected) {
        selectedTeams.push(row)
        seenSelectedLabels.add(selected.label)
      }
    }
  }

  const missing = SELECTED_TEAMS.filter((selected) => !seenSelectedLabels.has(selected.label))
  if (missing.length > 0) {
    throw new Error(`Could not find selected teams from API-Football: ${missing.map((team) => team.label).join(', ')}`)
  }

  return {
    teams,
    selectedTeams: selectedTeams.sort((a, b) => a.drawSeedOrder - b.drawSeedOrder),
  }
}

function matchToFirestore(fixture, matchNumber, league) {
  const status = mapStatus(fixture.fixture.status.short)
  const isExtraTimeFinal = ['AET', 'PEN'].includes(fixture.fixture.status.short)
  const fulltimeHome = fixture.score.fulltime.home
  const fulltimeAway = fixture.score.fulltime.away
  const stage = normalizeStage(fixture.league.round)

  return {
    matchNumber,
    group: league.name,
    homeTeamId: String(fixture.teams.home.id),
    awayTeamId: String(fixture.teams.away.id),
    date: new Date(fixture.fixture.date),
    venue: fixture.fixture.venue?.name ?? fixture.fixture.venue?.city ?? '',
    stage,
    status,
    homeScore: fixtureScore(fixture, 'home'),
    awayScore: fixtureScore(fixture, 'away'),
    qualifier: getQualifier(fixture, stage),
    minute: status === 'live' ? fixture.fixture.status.elapsed : null,
    statusShort: status === 'live' ? fixture.fixture.status.short : null,
    apiFootballFixtureId: fixture.fixture.id,
    leagueId: league.id,
    season: league.season,
    source: `API-Football ${league.name} ${league.seasonLabel}`,
    ...(isExtraTimeFinal && fulltimeHome !== null && fulltimeAway !== null ? {
      regularTimeScoreHome: fulltimeHome,
      regularTimeScoreAway: fulltimeAway,
    } : {}),
  }
}

function buildMatches(leagueRows, selectedTeamIds) {
  const matches = []

  for (const { league, fixturesBody } of leagueRows) {
    const selectedFixtures = (fixturesBody.response ?? [])
      .filter((fixture) =>
        fixture?.fixture?.id
        && fixture?.teams?.home?.id
        && fixture?.teams?.away?.id
        && (
          selectedTeamIds.has(String(fixture.teams.home.id))
          || selectedTeamIds.has(String(fixture.teams.away.id))
        ),
      )

    for (const fixture of selectedFixtures) {
      matches.push({ fixture, league })
    }
  }

  return matches
    .sort((a, b) => new Date(a.fixture.fixture.date) - new Date(b.fixture.fixture.date))
    .map(({ fixture, league }, index) => ({
      id: String(fixture.fixture.id),
      data: matchToFirestore(fixture, index + 1, league),
    }))
}

function calculateInitialSyncPeriod(matches, now = new Date()) {
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  let regularMatches = 0
  let knockoutMatches = 0
  const pollingWindows = []

  for (const match of matches) {
    if (match.data.status === 'finished') continue
    const pollingWindow = intersectPollingWindow(match.data.date, now, windowEnd)
    if (!pollingWindow) continue
    pollingWindows.push(pollingWindow)

    if (isKnockoutStage(match.data.stage)) knockoutMatches++
    else regularMatches++
  }

  const syncPeriod = syncPeriodForPollingWindows(pollingWindows)

  return { regularMatches, knockoutMatches, ...syncPeriod }
}

async function fetchHybridData(apiKey) {
  const leagueRows = await Promise.all(LEAGUES.map(async (league) => {
    const [teamsBody, fixturesBody] = await Promise.all([
      apiGet('/teams', { league: league.id, season: league.season }, apiKey),
      apiGet('/fixtures', { league: league.id, season: league.season }, apiKey),
    ])
    return { league, teamsBody, fixturesBody }
  }))

  const { teams, selectedTeams } = buildTeams(leagueRows)
  const selectedTeamIds = new Set(selectedTeams.map((team) => team.id))
  const matches = buildMatches(leagueRows, selectedTeamIds)

  return {
    teams,
    selectedTeams,
    matches,
    apiRequestsUsed: LEAGUES.length * 2,
  }
}

async function verifySeed(token) {
  const [teams, matches, config] = await Promise.all([
    listCollection('teams', token),
    listCollection('matches', token),
    getDocument('config/app', token),
  ])
  const drawEligibleTeams = teams.filter((team) => team.drawEligible === true)
  const failures = []

  if (drawEligibleTeams.length !== SELECTED_TEAMS.length) {
    failures.push(`Expected ${SELECTED_TEAMS.length} draw-eligible teams, found ${drawEligibleTeams.length}`)
  }
  if (matches.length === 0) failures.push('Expected hybrid test matches, found 0')
  if (!config) {
    failures.push('config/app is missing')
  } else {
    if (config.competitionMode !== COMPETITION_MODE) failures.push(`config.competitionMode: ${config.competitionMode}`)
    if (config.drawStatus !== 'list_building') failures.push(`config.drawStatus: ${config.drawStatus}`)
    if (config.drawTeamCount !== SELECTED_TEAMS.length) failures.push(`config.drawTeamCount: ${config.drawTeamCount}`)
    const activeLeagueIds = Array.isArray(config.activeLeagueIds) ? config.activeLeagueIds : []
    for (const league of LEAGUES) {
      if (!activeLeagueIds.includes(league.id)) failures.push(`config.activeLeagueIds does not include ${league.id}`)
    }
    const selectedTeamIds = Array.isArray(config.selectedTeamIds) ? config.selectedTeamIds : []
    if (selectedTeamIds.length !== SELECTED_TEAMS.length) {
      failures.push(`config.selectedTeamIds length: ${selectedTeamIds.length}`)
    }
  }

  if (failures.length > 0) {
    console.log('Hybrid seed verification failed:')
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exit(1)
  }

  console.log('Hybrid seed verification OK.')
}

async function seedFirestore(token, teams, selectedTeams, matches, syncPeriod) {
  for (const collectionId of RESET_COLLECTIONS) {
    const count = await deleteCollection(collectionId, token)
    console.log(`Deleted ${count} document(s) from ${collectionId}`)
  }
  for (const docPath of RESET_DOCS) await deleteDocument(docPath, token)

  for (const team of teams) await patchDocument(`teams/${team.id}`, team, token)
  for (const match of matches) await patchDocument(`matches/${match.id}`, match.data, token)

  const selectedTeamIds = selectedTeams.map((team) => team.id)
  await patchDocument('config/app', {
    competitionMode: COMPETITION_MODE,
    competitionName: COMPETITION_NAME,
    drawStatus: 'list_building',
    drawRankingSnapshot: DRAW_SNAPSHOT,
    drawRankingSnapshotDate: new Date().toISOString().slice(0, 10),
    drawTeamCount: selectedTeams.length,
    teamsPerPlayer: selectedTeams.length,
    teamsSeededAt: new Date(),
    matchesSeededAt: new Date(),
    selectedTeamIds,
    liveSyncTeamIds: selectedTeamIds,
    activeLeagueIds: LEAGUES.map((league) => league.id),
    activeLeagueSeasons: Object.fromEntries(LEAGUES.map((league) => [String(league.id), league.season])),
    activeLeagues: LEAGUES.map((league) => ({
      id: league.id,
      season: league.season,
      name: league.name,
    })),
    syncPeriodSeconds: syncPeriod.syncPeriodSeconds,
    syncPeriodMinutes: syncPeriod.syncPeriodMinutes,
    syncPeriodUpdatedAt: new Date(),
    syncPeriodRegularMatches: syncPeriod.regularMatches,
    syncPeriodKnockoutMatches: syncPeriod.knockoutMatches,
    syncPeriodPollingWindowSeconds: syncPeriod.pollingWindowSeconds,
    syncPeriodPollingWindowMinutes: syncPeriod.pollingWindowMinutes,
    syncPeriodPollingWindowCount: syncPeriod.regularMatches + syncPeriod.knockoutMatches,
    syncPeriodMergedWindowCount: syncPeriod.mergedWindowCount,
    syncPeriodEstimatedApiCalls: syncPeriod.estimatedApiCalls,
    syncPeriodRequestBudget: API_REQUEST_BUDGET,
    syncPeriodMinimumSeconds: MIN_LIVE_SYNC_PERIOD_SECONDS,
    syncPeriodCalculatedSeconds: syncPeriod.calculatedSyncPeriodSeconds,
    lastLiveSyncAt: null,
    gameStartedAt: null,
  }, token)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const confirmed = process.argv.includes('--confirm')
  const verify = process.argv.includes('--verify')
  if ([dryRun, confirmed, verify].filter(Boolean).length !== 1) usageAndExit()

  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Mode: ${dryRun ? 'dry-run' : verify ? 'verify' : 'CONFIRMED HYBRID SEED'}`)

  if (verify) {
    const token = await getToken()
    await verifySeed(token)
    return
  }

  const apiKey = getApiFootballKey()
  const { teams, selectedTeams, matches, apiRequestsUsed } = await fetchHybridData(apiKey)
  const syncPeriod = calculateInitialSyncPeriod(matches)

  console.log(`API requests used: ${apiRequestsUsed}`)
  console.log(`Teams seeded: ${teams.length}`)
  console.log(`Draw-eligible teams: ${selectedTeams.length}`)
  console.log(`Matches involving selected teams: ${matches.length}`)
  console.log(
    `Initial sync period: ${syncPeriod.syncPeriodSeconds}s (${syncPeriod.estimatedApiCalls} estimated API calls across ${syncPeriod.pollingWindowSeconds}s of polling windows, ${syncPeriod.regularMatches} regular, ${syncPeriod.knockoutMatches} knockout in next 24h)`,
  )

  if (selectedTeams.length !== SELECTED_TEAMS.length) {
    throw new Error(`Expected ${SELECTED_TEAMS.length} selected teams, got ${selectedTeams.length}`)
  }
  if (matches.length === 0) throw new Error('API-Football returned no hybrid test fixtures.')

  console.log('')
  console.log('Default draw order:')
  for (const team of selectedTeams) {
    console.log(`${String(team.drawSeedOrder).padStart(2, '0')}. ${team.flag} ${team.name} (${team.group})`)
  }

  console.log('')
  console.log('First 20 fixtures:')
  for (const match of matches.slice(0, 20)) {
    console.log(
      `#${String(match.data.matchNumber).padStart(3, '0')} ${match.data.date.toISOString()} L${match.data.leagueId} ${match.data.homeTeamId} vs ${match.data.awayTeamId}`,
    )
  }

  if (dryRun) return

  const token = await getToken()
  await seedFirestore(token, teams, selectedTeams, matches, syncPeriod)

  console.log('')
  console.log('Hybrid test tournament seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
