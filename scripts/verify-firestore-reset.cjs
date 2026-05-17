// Verifies the Firestore state after the pre-teams-draw reset.
//
// node scripts/verify-firestore-reset.cjs

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

const KEPT_COLLECTIONS = ['users', 'allowedUsers', 'pushTokens']
const EMPTY_COLLECTIONS = ['teams', 'matches', 'predictions', 'playerTeams', 'messages', 'chatReads']
const REMOVED_CONFIG_FIELDS = [
  'activeLeagueId',
  'activeLeagueIds',
  'syncPeriodSeconds',
  'syncPeriodMinutes',
  'syncPeriodUpdatedAt',
  'lastLiveSyncAt',
  'lastLiveSyncLoopAt',
]

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

async function countCollection(collectionId, token) {
  let count = 0
  let nextPageToken = null

  do {
    const qs = new URLSearchParams({ pageSize: '300' })
    if (nextPageToken) qs.set('pageToken', nextPageToken)

    const res = await request('GET', 'firestore.googleapis.com', `${BASE}/${collectionId}?${qs.toString()}`, null, token)
    if (res.status === 404) return 0
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to read ${collectionId}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }

    count += (res.body.documents ?? []).length
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return count
}

async function getConfig(token) {
  const res = await request('GET', 'firestore.googleapis.com', `${BASE}/config/app`, null, token)
  if (res.status === 404) return null
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to read config/app: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body.fields ?? {}
}

async function main() {
  const token = await getToken()
  const failures = []

  console.log(`Project: ${PROJECT_ID}`)
  console.log('')

  console.log('Kept collections:')
  for (const collectionId of KEPT_COLLECTIONS) {
    const count = await countCollection(collectionId, token)
    console.log(`  ${collectionId}: ${count}`)
    if (count === 0) failures.push(`${collectionId} is empty`)
  }

  console.log('')
  console.log('Purged collections:')
  for (const collectionId of EMPTY_COLLECTIONS) {
    const count = await countCollection(collectionId, token)
    console.log(`  ${collectionId}: ${count}`)
    if (count !== 0) failures.push(`${collectionId} still has ${count} document(s)`)
  }

  const config = await getConfig(token)
  console.log('')
  console.log('config/app:')
  if (!config) {
    console.log('  missing')
    failures.push('config/app is missing')
  } else {
    const gameStartedAtOk = Object.prototype.hasOwnProperty.call(config.gameStartedAt ?? {}, 'nullValue')
    console.log(`  gameStartedAt null: ${gameStartedAtOk ? 'yes' : 'no'}`)
    if (!gameStartedAtOk) failures.push('config/app.gameStartedAt is not null')

    for (const field of REMOVED_CONFIG_FIELDS) {
      const exists = Object.prototype.hasOwnProperty.call(config, field)
      console.log(`  ${field} removed: ${exists ? 'no' : 'yes'}`)
      if (exists) failures.push(`config/app.${field} still exists`)
    }
  }

  if (failures.length > 0) {
    console.log('')
    console.log('Verification failed:')
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exit(1)
  }

  console.log('')
  console.log('Verification OK.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
