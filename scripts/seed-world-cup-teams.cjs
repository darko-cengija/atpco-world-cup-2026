// Seeds the 48 FIFA World Cup 2026 teams and draw config.
//
// node scripts/seed-world-cup-teams.cjs --dry-run
// node scripts/seed-world-cup-teams.cjs --confirm
// node scripts/seed-world-cup-teams.cjs --verify

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const teams = require('../src/data/worldCup2026Teams.json')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
const RANKING_SNAPSHOT = 'FIFA/Coca-Cola Men’s World Ranking, 1 April 2026'
const RANKING_SNAPSHOT_DATE = '2026-04-01'
const WORLD_CUP_LEAGUE_ID = 1
const WORLD_CUP_SEASON = 2026

function usageAndExit() {
  console.error('Usage: node scripts/seed-world-cup-teams.cjs --dry-run | --confirm | --verify')
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

async function patchDocument(pathPart, data, token) {
  const updateMask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&')
  const res = await request(
    'PATCH',
    'firestore.googleapis.com',
    `${BASE}/${pathPart}?${updateMask}`,
    { fields: fieldsFromObject(data) },
    token,
  )
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to write ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
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

async function getDocument(pathPart, token) {
  const res = await request('GET', 'firestore.googleapis.com', `${BASE}/${pathPart}`, null, token)
  if (res.status === 404) return null
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to read ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
  return firestoreFieldsToJs(res.body.fields)
}

async function listTeams(token) {
  const docs = []
  let nextPageToken = null

  do {
    const qs = new URLSearchParams({ pageSize: '300' })
    if (nextPageToken) qs.set('pageToken', nextPageToken)
    const res = await request('GET', 'firestore.googleapis.com', `${BASE}/teams?${qs.toString()}`, null, token)
    if (res.status === 404) return docs
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to list teams: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }
    for (const doc of res.body.documents ?? []) {
      docs.push({
        id: doc.name.split('/').pop(),
        ...firestoreFieldsToJs(doc.fields),
      })
    }
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return docs
}

async function verifySeed(token) {
  const remoteTeams = await listTeams(token)
  const config = await getDocument('config/app', token)
  const expectedById = new Map(teams.map((team) => [team.id, team]))
  const failures = []

  if (remoteTeams.length !== 48) failures.push(`Expected 48 teams, found ${remoteTeams.length}`)
  for (const team of remoteTeams) {
    const expected = expectedById.get(team.id)
    if (!expected) {
      failures.push(`Unexpected team: ${team.id}`)
      continue
    }
    const replaced = team.replacement?.active === true
    const fields = replaced
      ? ['group', 'drawSeedOrder']
      : ['name', 'flag', 'confederation', 'group', 'fifaRank', 'drawSeedOrder']
    for (const field of fields) {
      if (team[field] !== expected[field]) {
        failures.push(`${team.id}.${field}: expected ${expected[field]}, got ${team[field]}`)
      }
    }
    if (team.drawEligible !== true) failures.push(`${team.id}.drawEligible is not true`)
    if (team.fifaRankingSnapshot !== RANKING_SNAPSHOT_DATE) {
      failures.push(`${team.id}.fifaRankingSnapshot: expected ${RANKING_SNAPSHOT_DATE}, got ${team.fifaRankingSnapshot}`)
    }
  }

  if (!config) {
    failures.push('config/app is missing')
  } else {
    if (config.drawStatus !== 'list_building') failures.push(`config.drawStatus: ${config.drawStatus}`)
    if (config.competitionMode !== 'world_cup_2026') failures.push(`config.competitionMode: ${config.competitionMode}`)
    if (config.competitionName !== 'Argy Bargy') failures.push(`config.competitionName: ${config.competitionName}`)
    if (config.drawRankingSnapshot !== RANKING_SNAPSHOT) failures.push(`config.drawRankingSnapshot: ${config.drawRankingSnapshot}`)
    if (config.drawTeamCount !== 48) failures.push(`config.drawTeamCount: ${config.drawTeamCount}`)
    if (config.teamsPerPlayer !== 48) failures.push(`config.teamsPerPlayer: ${config.teamsPerPlayer}`)
  }

  if (failures.length > 0) {
    console.log('Seed verification failed:')
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exit(1)
  }

  console.log('Seed verification OK.')
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const confirmed = process.argv.includes('--confirm')
  const verify = process.argv.includes('--verify')
  if ([dryRun, confirmed, verify].filter(Boolean).length !== 1) usageAndExit()

  const ids = new Set(teams.map((team) => team.id))
  if (teams.length !== 48 || ids.size !== 48) {
    throw new Error(`Expected 48 unique teams, got ${teams.length} rows and ${ids.size} unique ids`)
  }

  const seedOrders = teams.map((team) => team.drawSeedOrder).sort((a, b) => a - b)
  for (let i = 0; i < seedOrders.length; i += 1) {
    if (seedOrders[i] !== i + 1) throw new Error('drawSeedOrder must contain every value from 1 to 48')
  }

  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Mode: ${dryRun ? 'dry-run' : verify ? 'verify' : 'CONFIRMED SEED'}`)
  console.log(`Teams: ${teams.length}`)
  console.log(`Ranking snapshot: ${RANKING_SNAPSHOT}`)

  if (dryRun) {
    for (const team of teams) {
      console.log(`${String(team.drawSeedOrder).padStart(2, '0')}. #${team.fifaRank} ${team.flag} ${team.name}`)
    }
    return
  }

  const token = await getToken()
  if (verify) {
    await verifySeed(token)
    return
  }

  for (const team of teams) {
    const existing = await getDocument(`teams/${team.id}`, token)
    if (existing?.replacement?.active === true) {
      console.log(`Skipping ${team.id}: active replacement ${existing.name}`)
      continue
    }
    await patchDocument(`teams/${team.id}`, {
      ...team,
      drawEligible: true,
      fifaRankingSnapshot: RANKING_SNAPSHOT_DATE,
    }, token)
  }

  await patchDocument('config/app', {
    competitionMode: 'world_cup_2026',
    competitionName: 'Argy Bargy',
    drawStatus: 'list_building',
    drawRankingSnapshot: RANKING_SNAPSHOT,
    drawRankingSnapshotDate: RANKING_SNAPSHOT_DATE,
    drawTeamCount: 48,
    teamsPerPlayer: 48,
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
  }, token)

  console.log('')
  console.log('Seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
