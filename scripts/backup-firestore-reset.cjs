// Creates a local JSON backup of the Firestore collections involved in the
// pre-teams-draw reset. This script only reads data.
//
// node scripts/backup-firestore-reset.cjs

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
const COLLECTIONS = [
  'users',
  'allowedUsers',
  'pushTokens',
  'teams',
  'matches',
  'predictions',
  'playerTeams',
  'messages',
  'chatReads',
  'config',
]

function getStoredRefreshToken() {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json')
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const token = data.tokens && data.tokens.refresh_token
  if (!token) throw new Error(`No Firebase CLI refresh token found at ${configPath}`)
  return token
}

function request(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'firestore.googleapis.com',
      path: urlPath,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
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

    const res = await request('GET', `${BASE}/${collectionId}?${qs.toString()}`, null, token)
    if (res.status === 404) return docs
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to read ${collectionId}: HTTP ${res.status} ${JSON.stringify(res.body)}`)
    }

    for (const doc of res.body.documents ?? []) {
      docs.push(doc)
    }
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)

  return docs
}

async function main() {
  const token = await getToken()
  const startedAt = new Date()
  const backup = {
    projectId: PROJECT_ID,
    createdAt: startedAt.toISOString(),
    collections: {},
  }

  for (const collectionId of COLLECTIONS) {
    const docs = await listCollection(collectionId, token)
    backup.collections[collectionId] = docs
    console.log(`${collectionId}: ${docs.length}`)
  }

  const outDir = path.join(process.cwd(), 'backups')
  fs.mkdirSync(outDir, { recursive: true })
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
  const outPath = path.join(outDir, `pre-teams-draw-reset-${stamp}.json`)
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2))

  console.log(`\nBackup written to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
