// Seeds an MLS-backed test tournament that uses the normal list/draw/prediction flow.
//
// Dry run:
//   API_FOOTBALL_KEY=... FIREBASE_PROJECT_ID=... node scripts/seed-mls-test-tournament.cjs --dry-run
//
// Real seed:
//   API_FOOTBALL_KEY=... FIREBASE_PROJECT_ID=... node scripts/seed-mls-test-tournament.cjs --confirm
//
// Verify Firestore:
//   FIREBASE_PROJECT_ID=... node scripts/seed-mls-test-tournament.cjs --verify

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
const MLS_LEAGUE_ID = 253
const MLS_SEASON = 2026
const COMPETITION_MODE = 'mls_test'
const COMPETITION_NAME = 'MLS Test Tournament'
const DRAW_SNAPSHOT = '2026 MLS standings/API-Football team list'
const API_REQUEST_BUDGET = 95
const LIVE_LOOKBACK_MINUTES = 180
const LIVE_LOOKAHEAD_MINUTES = 30

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
]

function usageAndExit() {
  console.error('Usage: node scripts/seed-mls-test-tournament.cjs --dry-run | --confirm | --verify')
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
  if (!key) throw new Error('Set API_FOOTBALL_KEY before running the MLS seed.')
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

function pollingWindowMinutes(windows) {
  return windows.reduce((total, window) => total + Math.ceil((window.endMs - window.startMs) / 60000), 0)
}

function estimatedApiCalls(windows, periodMinutes) {
  if (periodMinutes <= 0) return Number.POSITIVE_INFINITY
  return windows.reduce((total, window) => {
    const minutes = Math.ceil((window.endMs - window.startMs) / 60000)
    return total + Math.ceil(minutes / periodMinutes)
  }, 0)
}

function syncPeriodForPollingWindows(windows) {
  const mergedWindows = mergePollingWindows(windows)
  const minutes = pollingWindowMinutes(mergedWindows)
  if (minutes === 0) {
    return {
      mergedWindowCount: 0,
      pollingWindowMinutes: 0,
      estimatedApiCalls: 0,
      syncPeriodMinutes: 1,
    }
  }

  for (let period = 1; period <= minutes; period++) {
    const calls = estimatedApiCalls(mergedWindows, period)
    if (calls <= API_REQUEST_BUDGET) {
      return {
        mergedWindowCount: mergedWindows.length,
        pollingWindowMinutes: minutes,
        estimatedApiCalls: calls,
        syncPeriodMinutes: period,
      }
    }
  }

  return {
    mergedWindowCount: mergedWindows.length,
    pollingWindowMinutes: minutes,
    estimatedApiCalls: estimatedApiCalls(mergedWindows, minutes),
    syncPeriodMinutes: minutes,
  }
}

function getQualifier(fixture) {
  const short = fixture.fixture.status.short
  if (!['AET', 'PEN'].includes(short)) return null
  const fulltime = fixture.score.fulltime
  if (fulltime.home === null || fulltime.away === null || fulltime.home !== fulltime.away) return null
  if (fixture.teams.home.winner) return 'home'
  if (fixture.teams.away.winner) return 'away'
  return null
}

function flattenStandings(standingsBody) {
  const standings = standingsBody.response?.[0]?.league?.standings ?? []
  return standings.flat().filter((row) => row?.team?.id)
}

function buildTeams(teamsBody, standingsBody) {
  const standingById = new Map()
  for (const row of flattenStandings(standingsBody)) {
    standingById.set(row.team.id, {
      group: row.group || 'MLS',
      rank: row.rank ?? 999,
      points: row.points ?? 0,
      goalsDiff: row.goalsDiff ?? 0,
      goalsFor: row.all?.goals?.for ?? 0,
    })
  }

  const rows = (teamsBody.response ?? [])
    .map((entry) => entry.team)
    .filter((team) => team?.id && team?.name)
    .sort((a, b) => {
      const sa = standingById.get(a.id)
      const sb = standingById.get(b.id)
      if (sa && sb) {
        if (sb.points !== sa.points) return sb.points - sa.points
        if (sb.goalsDiff !== sa.goalsDiff) return sb.goalsDiff - sa.goalsDiff
        if (sb.goalsFor !== sa.goalsFor) return sb.goalsFor - sa.goalsFor
        if (sa.rank !== sb.rank) return sa.rank - sb.rank
      }
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    })

  return rows.map((team, index) => {
    const standing = standingById.get(team.id)
    const aliases = [team.name, team.code].filter((value) => typeof value === 'string' && value.trim())
    return {
      id: String(team.id),
      name: team.name,
      flag: team.code || 'MLS',
      group: standing?.group ?? 'MLS',
      confederation: 'MLS',
      drawEligible: true,
      drawSeedOrder: index + 1,
      fifaRank: index + 1,
      fifaRankingSnapshot: new Date().toISOString().slice(0, 10),
      apiFootballTeamId: team.id,
      apiFootballAliases: Array.from(new Set(aliases)),
      leagueId: MLS_LEAGUE_ID,
      season: MLS_SEASON,
    }
  })
}

function matchToFirestore(fixture, matchNumber) {
  const status = mapStatus(fixture.fixture.status.short)
  const isExtraTimeFinal = ['AET', 'PEN'].includes(fixture.fixture.status.short)
  const fulltimeHome = fixture.score.fulltime.home
  const fulltimeAway = fixture.score.fulltime.away

  return {
    matchNumber,
    group: 'MLS',
    homeTeamId: String(fixture.teams.home.id),
    awayTeamId: String(fixture.teams.away.id),
    date: new Date(fixture.fixture.date),
    venue: fixture.fixture.venue?.name ?? fixture.fixture.venue?.city ?? '',
    stage: normalizeStage(fixture.league.round),
    status,
    homeScore: fixture.goals.home ?? fixture.score.fulltime.home,
    awayScore: fixture.goals.away ?? fixture.score.fulltime.away,
    qualifier: getQualifier(fixture),
    minute: status === 'live' ? fixture.fixture.status.elapsed : null,
    statusShort: status === 'live' ? fixture.fixture.status.short : null,
    apiFootballFixtureId: fixture.fixture.id,
    leagueId: MLS_LEAGUE_ID,
    season: MLS_SEASON,
    source: 'API-Football MLS 2026',
    ...(isExtraTimeFinal && fulltimeHome !== null && fulltimeAway !== null ? {
      regularTimeScoreHome: fulltimeHome,
      regularTimeScoreAway: fulltimeAway,
    } : {}),
  }
}

function buildMatches(fixturesBody) {
  return (fixturesBody.response ?? [])
    .filter((fixture) => fixture?.fixture?.id && fixture?.teams?.home?.id && fixture?.teams?.away?.id)
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
    .map((fixture, index) => ({
      id: String(fixture.fixture.id),
      data: matchToFirestore(fixture, index + 1),
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

async function fetchMlsData(apiKey) {
  const [teamsBody, standingsBody, fixturesBody] = await Promise.all([
    apiGet('/teams', { league: MLS_LEAGUE_ID, season: MLS_SEASON }, apiKey),
    apiGet('/standings', { league: MLS_LEAGUE_ID, season: MLS_SEASON }, apiKey),
    apiGet('/fixtures', { league: MLS_LEAGUE_ID, season: MLS_SEASON }, apiKey),
  ])

  return {
    teams: buildTeams(teamsBody, standingsBody),
    matches: buildMatches(fixturesBody),
    apiRequestsUsed: 3,
  }
}

async function verifySeed(token) {
  const [teams, matches, config] = await Promise.all([
    listCollection('teams', token),
    listCollection('matches', token),
    getDocument('config/app', token),
  ])
  const failures = []

  if (teams.length !== 30) failures.push(`Expected 30 MLS teams, found ${teams.length}`)
  if (matches.length === 0) failures.push('Expected MLS matches, found 0')
  if (!config) {
    failures.push('config/app is missing')
  } else {
    if (config.competitionMode !== COMPETITION_MODE) failures.push(`config.competitionMode: ${config.competitionMode}`)
    if (config.drawStatus !== 'list_building') failures.push(`config.drawStatus: ${config.drawStatus}`)
    if (config.drawTeamCount !== teams.length) failures.push(`config.drawTeamCount: ${config.drawTeamCount}`)
    if (!Array.isArray(config.activeLeagueIds) || !config.activeLeagueIds.includes(MLS_LEAGUE_ID)) {
      failures.push(`config.activeLeagueIds does not include ${MLS_LEAGUE_ID}`)
    }
  }

  if (failures.length > 0) {
    console.log('MLS seed verification failed:')
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exit(1)
  }

  console.log('MLS seed verification OK.')
}

async function seedFirestore(token, teams, matches, syncPeriod) {
  for (const collectionId of RESET_COLLECTIONS) {
    const count = await deleteCollection(collectionId, token)
    console.log(`Deleted ${count} document(s) from ${collectionId}`)
  }
  for (const docPath of RESET_DOCS) await deleteDocument(docPath, token)

  for (const team of teams) await patchDocument(`teams/${team.id}`, team, token)
  for (const match of matches) await patchDocument(`matches/${match.id}`, match.data, token)

  await patchDocument('config/app', {
    competitionMode: COMPETITION_MODE,
    competitionName: COMPETITION_NAME,
    drawStatus: 'list_building',
    drawRankingSnapshot: DRAW_SNAPSHOT,
    drawRankingSnapshotDate: new Date().toISOString().slice(0, 10),
    drawTeamCount: teams.length,
    teamsPerPlayer: teams.length,
    teamsSeededAt: new Date(),
    matchesSeededAt: new Date(),
    activeLeagueId: MLS_LEAGUE_ID,
    activeLeagueIds: [MLS_LEAGUE_ID],
    activeLeagueSeason: MLS_SEASON,
    syncPeriodMinutes: syncPeriod.syncPeriodMinutes,
    syncPeriodUpdatedAt: new Date(),
    syncPeriodRegularMatches: syncPeriod.regularMatches,
    syncPeriodKnockoutMatches: syncPeriod.knockoutMatches,
    syncPeriodPollingWindowMinutes: syncPeriod.pollingWindowMinutes,
    syncPeriodPollingWindowCount: syncPeriod.regularMatches + syncPeriod.knockoutMatches,
    syncPeriodMergedWindowCount: syncPeriod.mergedWindowCount,
    syncPeriodEstimatedApiCalls: syncPeriod.estimatedApiCalls,
    syncPeriodRequestBudget: API_REQUEST_BUDGET,
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
  console.log(`Mode: ${dryRun ? 'dry-run' : verify ? 'verify' : 'CONFIRMED MLS SEED'}`)

  if (verify) {
    const token = await getToken()
    await verifySeed(token)
    return
  }

  const apiKey = getApiFootballKey()
  const { teams, matches, apiRequestsUsed } = await fetchMlsData(apiKey)
  const syncPeriod = calculateInitialSyncPeriod(matches)

  console.log(`API requests used: ${apiRequestsUsed}`)
  console.log(`Teams: ${teams.length}`)
  console.log(`Matches: ${matches.length}`)
  console.log(
    `Initial sync period: ${syncPeriod.syncPeriodMinutes} min (${syncPeriod.estimatedApiCalls} estimated API calls across ${syncPeriod.pollingWindowMinutes} polling minutes, ${syncPeriod.regularMatches} regular, ${syncPeriod.knockoutMatches} knockout in next 24h)`,
  )

  if (teams.length !== 30) {
    throw new Error(`Expected 30 MLS teams for 2026, got ${teams.length}`)
  }
  if (matches.length === 0) {
    throw new Error('API-Football returned no MLS fixtures.')
  }

  console.log('')
  console.log('Default draw order:')
  for (const team of teams) {
    console.log(`${String(team.drawSeedOrder).padStart(2, '0')}. ${team.flag} ${team.name} (${team.group})`)
  }

  console.log('')
  console.log('First 10 fixtures:')
  for (const match of matches.slice(0, 10)) {
    console.log(
      `#${String(match.data.matchNumber).padStart(3, '0')} ${match.data.date.toISOString()} ${match.data.homeTeamId} vs ${match.data.awayTeamId}`,
    )
  }

  if (dryRun) return

  const token = await getToken()
  await seedFirestore(token, teams, matches, syncPeriod)

  console.log('')
  console.log('MLS test tournament seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
