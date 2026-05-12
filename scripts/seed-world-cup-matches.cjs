// Seeds the known FIFA World Cup 2026 group-stage fixtures.
//
// node scripts/seed-world-cup-matches.cjs --dry-run
// node scripts/seed-world-cup-matches.cjs --confirm
// node scripts/seed-world-cup-matches.cjs --verify

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const matches = require('../src/data/worldCup2026GroupMatches.json')
const teams = require('../src/data/worldCup2026Teams.json')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

function usageAndExit() {
  console.error('Usage: node scripts/seed-world-cup-matches.cjs --dry-run | --confirm | --verify')
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

async function deleteDocument(pathPart, token) {
  const res = await request('DELETE', 'firestore.googleapis.com', `${BASE}/${pathPart}`, null, token)
  if (res.status !== 200 && res.status !== 404) {
    throw new Error(`Failed to delete ${pathPart}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
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

async function listMatches(token) {
  const docs = []
  let nextPageToken = null

  do {
    const qs = new URLSearchParams({ pageSize: '300' })
    if (nextPageToken) qs.set('pageToken', nextPageToken)
    const res = await request('GET', 'firestore.googleapis.com', `${BASE}/matches?${qs.toString()}`, null, token)
    if (res.status === 404) return docs
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to list matches: HTTP ${res.status} ${JSON.stringify(res.body)}`)
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
    statusShort: null,
    source: 'FIFA World Cup 2026 official group-stage schedule',
  }
}

function validateLocalData() {
  const teamIds = new Set(teams.map((team) => team.id))
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

  if (matches.length !== 72) throw new Error(`Expected 72 group-stage matches, got ${matches.length}`)
}

async function verifySeed(token) {
  const remoteMatches = await listMatches(token)
  const expectedById = new Map(matches.map((match) => [match.id, matchToFirestore(match)]))
  const failures = []

  if (remoteMatches.length !== matches.length) {
    failures.push(`Expected ${matches.length} matches, found ${remoteMatches.length}`)
  }

  for (const remoteMatch of remoteMatches) {
    const expected = expectedById.get(remoteMatch.id)
    if (!expected) {
      failures.push(`Unexpected match: ${remoteMatch.id}`)
      continue
    }

    for (const field of ['matchNumber', 'group', 'homeTeamId', 'awayTeamId', 'venue', 'stage', 'status']) {
      if (remoteMatch[field] !== expected[field]) {
        failures.push(`${remoteMatch.id}.${field}: expected ${expected[field]}, got ${remoteMatch[field]}`)
      }
    }

    if (new Date(remoteMatch.date).toISOString() !== expected.date.toISOString()) {
      failures.push(`${remoteMatch.id}.date: expected ${expected.date.toISOString()}, got ${remoteMatch.date}`)
    }
  }

  if (failures.length > 0) {
    console.log('Match seed verification failed:')
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exit(1)
  }

  console.log('Match seed verification OK.')
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const confirmed = process.argv.includes('--confirm')
  const verify = process.argv.includes('--verify')
  if ([dryRun, confirmed, verify].filter(Boolean).length !== 1) usageAndExit()

  validateLocalData()

  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Mode: ${dryRun ? 'dry-run' : verify ? 'verify' : 'CONFIRMED SEED'}`)
  console.log(`Matches: ${matches.length}`)

  if (dryRun) {
    for (const match of [...matches].sort((a, b) => new Date(a.dateUtc) - new Date(b.dateUtc))) {
      console.log(`#${String(match.matchNumber).padStart(2, '0')} ${match.dateUtc} ${match.homeTeamId} v ${match.awayTeamId} (${match.venue})`)
    }
    return
  }

  const token = await getToken()
  if (verify) {
    await verifySeed(token)
    return
  }

  const existingMatches = await listMatches(token)
  const expectedIds = new Set(matches.map((match) => match.id))
  for (const match of existingMatches) {
    if (!expectedIds.has(match.id)) await deleteDocument(`matches/${match.id}`, token)
  }

  for (const match of matches) {
    await patchDocument(`matches/${match.id}`, matchToFirestore(match), token)
  }

  console.log('')
  console.log('Match seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
