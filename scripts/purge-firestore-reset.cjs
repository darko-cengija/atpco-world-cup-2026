// Purges old test tournament data for the teams-draw reset.
//
// Dry run:
//   node scripts/purge-firestore-reset.cjs --dry-run
//
// Real purge:
//   node scripts/purge-firestore-reset.cjs --confirm

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

const COLLECTIONS_TO_DELETE = [
  'teams',
  'matches',
  'predictions',
  'playerTeams',
  'messages',
  'chatReads',
]

const CONFIG_FIELDS_TO_RESET = {
  gameStartedAt: { nullValue: null },
}

const CONFIG_FIELDS_TO_DELETE = [
  'activeLeagueId',
  'activeLeagueIds',
  'syncPeriodMinutes',
  'syncPeriodUpdatedAt',
  'lastLiveSyncAt',
]

function usageAndExit() {
  console.error('Usage: node scripts/purge-firestore-reset.cjs --dry-run | --confirm')
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

    for (const doc of res.body.documents ?? []) docs.push(doc)
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return docs
}

async function deleteDocument(docName, token) {
  const res = await request('DELETE', 'firestore.googleapis.com', `/v1/${docName}`, null, token)
  if (res.status !== 200) {
    throw new Error(`Failed to delete ${docName}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

async function getConfig(token) {
  const res = await request('GET', 'firestore.googleapis.com', `${BASE}/config/app`, null, token)
  if (res.status === 404) return null
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to read config/app: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body
}

async function resetConfig(token) {
  const fieldsToKeepOrSet = { ...CONFIG_FIELDS_TO_RESET }
  const updateMask = [
    ...Object.keys(CONFIG_FIELDS_TO_RESET),
    ...CONFIG_FIELDS_TO_DELETE,
  ]
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&')

  const res = await request(
    'PATCH',
    'firestore.googleapis.com',
    `${BASE}/config/app?${updateMask}`,
    { fields: fieldsToKeepOrSet },
    token,
  )

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to reset config/app: HTTP ${res.status} ${JSON.stringify(res.body)}`)
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const confirmed = process.argv.includes('--confirm')
  if (dryRun === confirmed) usageAndExit()

  const token = await getToken()
  const docsByCollection = {}

  for (const collectionId of COLLECTIONS_TO_DELETE) {
    docsByCollection[collectionId] = await listCollection(collectionId, token)
  }

  const config = await getConfig(token)
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Mode: ${dryRun ? 'dry-run' : 'CONFIRMED PURGE'}`)
  console.log('')
  console.log('Will keep: users, allowedUsers, pushTokens')
  console.log('Will delete:')
  for (const collectionId of COLLECTIONS_TO_DELETE) {
    console.log(`  ${collectionId}: ${docsByCollection[collectionId].length}`)
  }
  console.log('')
  console.log('Will reset config/app.gameStartedAt to null')
  console.log(`Will delete config/app fields: ${CONFIG_FIELDS_TO_DELETE.join(', ')}`)
  console.log(`config/app currently exists: ${config ? 'yes' : 'no'}`)

  if (dryRun) return

  for (const collectionId of COLLECTIONS_TO_DELETE) {
    for (const doc of docsByCollection[collectionId]) {
      await deleteDocument(doc.name, token)
    }
  }

  await resetConfig(token)

  console.log('')
  console.log('Purge complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
