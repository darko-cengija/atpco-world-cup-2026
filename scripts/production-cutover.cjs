// Production cutover from test data to the World Cup 2026 setup.
//
// Backup:
//   FIREBASE_PROJECT_ID=atpco-world-cup-2026 node scripts/production-cutover.cjs --backup
//
// Dry run:
//   FIREBASE_PROJECT_ID=atpco-world-cup-2026 node scripts/production-cutover.cjs --dry-run
//
// Real cutover:
//   FIREBASE_PROJECT_ID=atpco-world-cup-2026 node scripts/production-cutover.cjs --confirm
//
// Verify:
//   FIREBASE_PROJECT_ID=atpco-world-cup-2026 node scripts/production-cutover.cjs --verify

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const KEEP_EMAIL = 'darko.cengija.dc@gmail.com'
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
const WORLD_CUP_LEAGUE_ID = 1
const WORLD_CUP_SEASON = 2026
const RANKING_SNAPSHOT = 'FIFA/Coca-Cola Men’s World Ranking, 1 April 2026'
const RANKING_SNAPSHOT_DATE = '2026-04-01'

const teams = require('../src/data/worldCup2026Teams.json')
const matches = require('../src/data/worldCup2026GroupMatches.json')

const ROOT_COLLECTIONS_TO_BACKUP = [
  'allowedUsers',
  'chatReads',
  'config',
  'draw',
  'inviteLogs',
  'matches',
  'messages',
  'playerTeams',
  'predictions',
  'pushTokens',
  'stats',
  'teamLists',
  'teamListStatuses',
  'teamReplacementHistory',
  'teams',
  'users',
]

const COLLECTIONS_TO_CLEAR = [
  'allowedUsers',
  'chatReads',
  'draw',
  'inviteLogs',
  'matches',
  'messages',
  'playerTeams',
  'predictions',
  'stats',
  'teamLists',
  'teamListStatuses',
  'teamReplacementHistory',
  'teams',
]

function usageAndExit() {
  console.error('Usage: node scripts/production-cutover.cjs --backup | --dry-run | --confirm | --verify')
  process.exit(1)
}

function getStoredRefreshToken() {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json')
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const token = data.tokens && data.tokens.refresh_token
  if (!token) throw new Error(`No Firebase CLI refresh token found at ${configPath}`)
  return token
}

function request(method, hostname, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname,
      path: urlPath,
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  const res = await requestForm('www.googleapis.com', '/oauth2/v3/token', {
    refresh_token: getStoredRefreshToken(),
    client_id: FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  })

  if (res.status < 200 || res.status >= 300 || typeof res.body.access_token !== 'string') {
    throw new Error(`Failed to refresh Firebase CLI token: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }

  return res.body.access_token
}

function valueToFirestore(value) {
  if (value === undefined) return undefined
  if (value === null) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) }
  if (typeof value === 'number') return { doubleValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(valueToFirestore).filter(Boolean) } }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .map(([key, nestedValue]) => [key, valueToFirestore(nestedValue)])
            .filter(([, nestedValue]) => nestedValue !== undefined),
        ),
      },
    }
  }
  throw new Error(`Unsupported Firestore value: ${value}`)
}

function fieldsFromObject(input) {
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, valueToFirestore(value)])
      .filter(([, value]) => value !== undefined),
  )
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
      Object.entries(value.mapValue.fields ?? {})
        .map(([key, nestedValue]) => [key, firestoreValueToJs(nestedValue)]),
    )
  }
  return undefined
}

function firestoreFieldsToJs(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, firestoreValueToJs(value)]),
  )
}

async function listCollectionIds(token) {
  const ids = []
  let pageToken = null

  do {
    const body = { pageSize: 300, ...(pageToken ? { pageToken } : {}) }
    const res = await request('POST', 'firestore.googleapis.com', `${BASE}:listCollectionIds`, body, token)
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to list root collection ids: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }
    ids.push(...(res.body.collectionIds ?? []))
    pageToken = res.body.nextPageToken ?? null
  } while (pageToken)

  return [...new Set([...ROOT_COLLECTIONS_TO_BACKUP, ...ids])].sort()
}

async function listCollection(collectionId, token) {
  const docs = []
  let nextPageToken = null

  do {
    const qs = new URLSearchParams({ pageSize: '300' })
    if (nextPageToken) qs.set('pageToken', nextPageToken)

    const res = await request('GET', 'firestore.googleapis.com', `${BASE}/${collectionId}?${qs.toString()}`, null, token)
    if (res.status === 404) return docs
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to read ${collectionId}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }

    for (const doc of res.body.documents ?? []) {
      docs.push({
        id: doc.name.split('/').pop(),
        name: doc.name,
        fields: doc.fields ?? {},
        data: firestoreFieldsToJs(doc.fields),
      })
    }
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return docs
}

async function listAuthUsers(token) {
  const users = []
  let nextPageToken = null

  do {
    const qs = new URLSearchParams({ maxResults: '1000' })
    if (nextPageToken) qs.set('nextPageToken', nextPageToken)
    const res = await request(
      'GET',
      'identitytoolkit.googleapis.com',
      `/v1/projects/${PROJECT_ID}/accounts:batchGet?${qs.toString()}`,
      null,
      token,
    )
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to list Auth users: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }
    users.push(...(res.body.users ?? []))
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return users
}

async function deleteAuthUser(localId, token) {
  const res = await request(
    'POST',
    'identitytoolkit.googleapis.com',
    `/v1/projects/${PROJECT_ID}/accounts:delete`,
    { localId },
    token,
  )
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to delete Auth user ${localId}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

async function deleteDocument(docName, token) {
  const res = await request('DELETE', 'firestore.googleapis.com', `/v1/${docName}`, null, token)
  if (res.status !== 200 && res.status !== 404) {
    throw new Error(`Failed to delete ${docName}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

async function patchDocument(pathPart, data, token) {
  const fields = fieldsFromObject(data)
  const updateMask = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&')
  const res = await request(
    'PATCH',
    'firestore.googleapis.com',
    `${BASE}/${pathPart}?${updateMask}`,
    { fields },
    token,
  )
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to write ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

function lower(value) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function matchToFirestore(match) {
  return {
    matchNumber: match.matchNumber,
    group: match.group,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    date: new Date(match.dateUtc),
    venue: match.venue,
    stage: 'Group Stage',
    status: 'upcoming',
    homeScore: null,
    awayScore: null,
    qualifier: null,
    minute: null,
    stoppageTime: null,
    statusShort: null,
    leagueId: WORLD_CUP_LEAGUE_ID,
    season: WORLD_CUP_SEASON,
    source: 'FIFA World Cup 2026 official group-stage schedule',
  }
}

function validateLocalData() {
  const teamIds = new Set(teams.map((team) => team.id))
  if (teams.length !== 48 || teamIds.size !== 48) {
    throw new Error(`Expected 48 unique teams, got ${teams.length} rows and ${teamIds.size} ids`)
  }

  const matchIds = new Set()
  const matchNumbers = new Set()
  for (const match of matches) {
    if (matchIds.has(match.id)) throw new Error(`Duplicate match id: ${match.id}`)
    if (matchNumbers.has(match.matchNumber)) throw new Error(`Duplicate match number: ${match.matchNumber}`)
    matchIds.add(match.id)
    matchNumbers.add(match.matchNumber)
    if (!teamIds.has(match.homeTeamId)) throw new Error(`${match.id}: unknown home team ${match.homeTeamId}`)
    if (!teamIds.has(match.awayTeamId)) throw new Error(`${match.id}: unknown away team ${match.awayTeamId}`)
    if (Number.isNaN(new Date(match.dateUtc).getTime())) throw new Error(`${match.id}: invalid date`)
  }
  if (matches.length !== 72) throw new Error(`Expected 72 matches, got ${matches.length}`)
}

function targetConfig() {
  return {
    competitionMode: 'world_cup_2026',
    competitionName: 'Argy-Bargy',
    drawStatus: 'list_building',
    drawRankingSnapshot: RANKING_SNAPSHOT,
    drawRankingSnapshotDate: RANKING_SNAPSHOT_DATE,
    drawTeamCount: 48,
    teamsPerPlayer: 48,
    gameStartedAt: null,
    activeLeagueId: WORLD_CUP_LEAGUE_ID,
    activeLeagueIds: [WORLD_CUP_LEAGUE_ID],
    activeLeagueSeason: WORLD_CUP_SEASON,
    activeLeagueSeasons: { [String(WORLD_CUP_LEAGUE_ID)]: WORLD_CUP_SEASON },
    activeLeagues: [{
      id: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      name: 'FIFA World Cup',
    }],
    teamsSeededAt: new Date(),
    matchesSeededAt: new Date(),
    productionCutoverAt: new Date(),
  }
}

async function readState(token) {
  const [
    authUsers,
    users,
    allowedUsers,
    teamsDocs,
    matchesDocs,
    predictions,
    playerTeams,
    teamLists,
    teamListStatuses,
    messages,
    chatReads,
    drawDocs,
    stats,
    configDocs,
    pushTokens,
  ] = await Promise.all([
    listAuthUsers(token),
    listCollection('users', token),
    listCollection('allowedUsers', token),
    listCollection('teams', token),
    listCollection('matches', token),
    listCollection('predictions', token),
    listCollection('playerTeams', token),
    listCollection('teamLists', token),
    listCollection('teamListStatuses', token),
    listCollection('messages', token),
    listCollection('chatReads', token),
    listCollection('draw', token),
    listCollection('stats', token),
    listCollection('config', token),
    listCollection('pushTokens', token),
  ])

  const worldCupTeamIds = new Set(teams.map((team) => team.id))
  const worldCupMatchIds = new Set(matches.map((match) => match.id))
  const keepAuth = authUsers.filter((user) => lower(user.email) === KEEP_EMAIL)
  const keepUid = keepAuth[0]?.localId
  const keepUsers = users.filter((doc) => lower(doc.data.email) === KEEP_EMAIL || doc.id === keepUid)
  const usersToDelete = users.filter((doc) => !keepUsers.some((keep) => keep.id === doc.id))
  const authToDelete = authUsers.filter((user) => lower(user.email) !== KEEP_EMAIL)
  const configApp = configDocs.find((doc) => doc.id === 'app')?.data ?? null

  return {
    authUsers,
    authToDelete,
    keepAuth,
    users,
    usersToDelete,
    keepUsers,
    allowedUsers,
    teamsDocs,
    matchesDocs,
    predictions,
    playerTeams,
    teamLists,
    teamListStatuses,
    messages,
    chatReads,
    drawDocs,
    stats,
    configDocs,
    configApp,
    pushTokens,
    worldCupTeams: teamsDocs.filter((doc) => worldCupTeamIds.has(doc.id)),
    worldCupMatches: matchesDocs.filter((doc) => worldCupMatchIds.has(doc.id)),
    nonWorldCupTeams: teamsDocs.filter((doc) => !worldCupTeamIds.has(doc.id)),
    nonWorldCupMatches: matchesDocs.filter((doc) => !worldCupMatchIds.has(doc.id)),
  }
}

function printPlan(state, mode) {
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Mode: ${mode}`)
  console.log('')
  console.log(`Auth users: ${state.authUsers.length}; keep ${state.keepAuth.length}; delete ${state.authToDelete.length}`)
  console.log(`Firestore users: ${state.users.length}; keep ${state.keepUsers.length}; delete ${state.usersToDelete.length}`)
  console.log(`Allowed users to clear: ${state.allowedUsers.length}`)
  console.log(`Teams: ${state.teamsDocs.length}; World Cup now ${state.worldCupTeams.length}; non-World-Cup to clear ${state.nonWorldCupTeams.length}`)
  console.log(`Matches: ${state.matchesDocs.length}; World Cup now ${state.worldCupMatches.length}; non-World-Cup to clear ${state.nonWorldCupMatches.length}`)
  console.log(`Predictions to clear: ${state.predictions.length}`)
  console.log(`Player assignments to clear: ${state.playerTeams.length}`)
  console.log(`Team lists/statuses to clear: ${state.teamLists.length}/${state.teamListStatuses.length}`)
  console.log(`Messages/chat reads to clear: ${state.messages.length}/${state.chatReads.length}`)
  console.log(`Draw/stat docs to clear: ${state.drawDocs.length}/${state.stats.length}`)
  console.log('')
  console.log('Will seed:')
  console.log(`  teams: ${teams.length}`)
  console.log(`  matches: ${matches.length}`)
  console.log(`  config/app.competitionMode: world_cup_2026`)
  console.log(`  config/app.drawStatus: list_building`)
  console.log(`  config/app.competitionName: Argy-Bargy`)
}

async function backup(token) {
  const startedAt = new Date()
  const collectionIds = await listCollectionIds(token)
  const backupData = {
    projectId: PROJECT_ID,
    createdAt: startedAt.toISOString(),
    authUsers: await listAuthUsers(token),
    collections: {},
  }

  for (const collectionId of collectionIds) {
    const docs = await listCollection(collectionId, token)
    backupData.collections[collectionId] = docs
    console.log(`${collectionId}: ${docs.length}`)
  }

  const outDir = path.join(process.cwd(), 'backups')
  fs.mkdirSync(outDir, { recursive: true })
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
  const outPath = path.join(outDir, `production-cutover-${stamp}.json`)
  fs.writeFileSync(outPath, JSON.stringify(backupData, null, 2))
  console.log(`Auth users: ${backupData.authUsers.length}`)
  console.log(`\nBackup written to ${outPath}`)
}

async function clearCollection(collectionId, token) {
  const docs = await listCollection(collectionId, token)
  for (const doc of docs) await deleteDocument(doc.name, token)
  return docs.length
}

async function confirmCutover(token) {
  validateLocalData()
  const state = await readState(token)
  printPlan(state, 'CONFIRMED CUTOVER')

  const keepAuth = state.keepAuth[0]
  const keepUser = state.keepUsers[0]
  if (!keepAuth) throw new Error(`Refusing to continue: Auth user ${KEEP_EMAIL} was not found`)
  if (!keepUser) throw new Error(`Refusing to continue: Firestore user ${KEEP_EMAIL} was not found`)

  for (const user of state.authToDelete) {
    await deleteAuthUser(user.localId, token)
  }

  for (const userDoc of state.usersToDelete) {
    await deleteDocument(userDoc.name, token)
  }

  for (const collectionId of COLLECTIONS_TO_CLEAR) {
    const deleted = await clearCollection(collectionId, token)
    console.log(`Cleared ${collectionId}: ${deleted}`)
  }

  const configDocs = await listCollection('config', token)
  for (const doc of configDocs) await deleteDocument(doc.name, token)
  console.log(`Cleared config: ${configDocs.length}`)

  await patchDocument(`users/${keepUser.id}`, {
    ...keepUser.data,
    email: KEEP_EMAIL,
    role: 'admin',
  }, token)

  for (const team of teams) {
    await patchDocument(`teams/${team.id}`, {
      ...team,
      drawEligible: true,
      fifaRankingSnapshot: RANKING_SNAPSHOT_DATE,
    }, token)
  }

  for (const match of matches) {
    await patchDocument(`matches/${match.id}`, matchToFirestore(match), token)
  }

  await patchDocument('config/app', targetConfig(), token)

  console.log('')
  console.log('Production cutover complete.')
}

async function verify(token) {
  const state = await readState(token)
  const failures = []
  const keepAuth = state.keepAuth[0]
  const keepUser = state.keepUsers[0]
  const config = state.configApp

  if (state.authUsers.length !== 1 || !keepAuth) failures.push(`Auth users: expected only ${KEEP_EMAIL}, found ${state.authUsers.length}`)
  if (state.users.length !== 1 || !keepUser) failures.push(`Firestore users: expected only ${KEEP_EMAIL}, found ${state.users.length}`)
  if (keepUser && keepUser.data.role !== 'admin') failures.push(`${KEEP_EMAIL} role is ${keepUser.data.role}`)
  if (state.allowedUsers.length !== 0) failures.push(`allowedUsers still has ${state.allowedUsers.length} doc(s)`)
  if (state.predictions.length !== 0) failures.push(`predictions still has ${state.predictions.length} doc(s)`)
  if (state.playerTeams.length !== 0) failures.push(`playerTeams still has ${state.playerTeams.length} doc(s)`)
  if (state.teamLists.length !== 0) failures.push(`teamLists still has ${state.teamLists.length} doc(s)`)
  if (state.teamListStatuses.length !== 0) failures.push(`teamListStatuses still has ${state.teamListStatuses.length} doc(s)`)
  if (state.messages.length !== 0) failures.push(`messages still has ${state.messages.length} doc(s)`)
  if (state.chatReads.length !== 0) failures.push(`chatReads still has ${state.chatReads.length} doc(s)`)
  if (state.drawDocs.length !== 0) failures.push(`draw still has ${state.drawDocs.length} doc(s)`)
  const unexpectedStats = state.stats.filter((doc) => doc.id !== 'winningChances')
  if (unexpectedStats.length > 0) {
    failures.push(`stats has unexpected doc(s): ${unexpectedStats.map((doc) => doc.id).join(', ')}`)
  }
  if (state.teamsDocs.length !== 48 || state.worldCupTeams.length !== 48 || state.nonWorldCupTeams.length !== 0) {
    failures.push(`teams expected 48 World Cup only; found total=${state.teamsDocs.length}, wc=${state.worldCupTeams.length}, nonWc=${state.nonWorldCupTeams.length}`)
  }
  if (state.matchesDocs.length !== 72 || state.worldCupMatches.length !== 72 || state.nonWorldCupMatches.length !== 0) {
    failures.push(`matches expected 72 World Cup only; found total=${state.matchesDocs.length}, wc=${state.worldCupMatches.length}, nonWc=${state.nonWorldCupMatches.length}`)
  }
  if (!config) failures.push('config/app is missing')
  else {
    if (config.competitionMode !== 'world_cup_2026') failures.push(`config.competitionMode is ${config.competitionMode}`)
    if (config.competitionName !== 'Argy-Bargy') failures.push(`config.competitionName is ${config.competitionName}`)
    if (config.drawStatus !== 'list_building') failures.push(`config.drawStatus is ${config.drawStatus}`)
    if (config.drawTeamCount !== 48) failures.push(`config.drawTeamCount is ${config.drawTeamCount}`)
    if (config.activeLeagueId !== WORLD_CUP_LEAGUE_ID) failures.push(`config.activeLeagueId is ${config.activeLeagueId}`)
  }

  console.log(`Project: ${PROJECT_ID}`)
  console.log('Mode: verify')
  console.log(`Auth users: ${state.authUsers.length}`)
  console.log(`Firestore users: ${state.users.length}`)
  console.log(`Teams: ${state.teamsDocs.length}`)
  console.log(`Matches: ${state.matchesDocs.length}`)
  console.log(`Predictions: ${state.predictions.length}`)
  console.log(`Player assignments: ${state.playerTeams.length}`)
  console.log(`Config mode/status: ${config?.competitionMode ?? 'missing'} / ${config?.drawStatus ?? 'missing'}`)

  if (failures.length > 0) {
    console.log('')
    console.log('Verification failed:')
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exit(1)
  }

  console.log('')
  console.log('Verification OK.')
}

async function main() {
  const backupMode = process.argv.includes('--backup')
  const dryRun = process.argv.includes('--dry-run')
  const confirmed = process.argv.includes('--confirm')
  const verifyMode = process.argv.includes('--verify')
  if ([backupMode, dryRun, confirmed, verifyMode].filter(Boolean).length !== 1) usageAndExit()

  validateLocalData()
  const token = await getToken()

  if (backupMode) {
    await backup(token)
    return
  }

  if (dryRun) {
    const state = await readState(token)
    printPlan(state, 'dry-run')
    return
  }

  if (confirmed) {
    await confirmCutover(token)
    return
  }

  await verify(token)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
