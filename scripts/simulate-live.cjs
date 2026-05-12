// Temporarily sets one upcoming match to live with a fake score.
// node scripts/simulate-live.cjs          — activate
// node scripts/simulate-live.cjs --revert — restore

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BACKUP_FILE = path.join(__dirname, '.simulate-live-backup.json')
const revert = process.argv.includes('--revert')

function getToken() {
  const data = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'))
  return data.tokens.access_token
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'firestore.googleapis.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }))
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`

async function runQuery(token, structuredQuery) {
  const res = await request('POST', `${BASE}:runQuery`, { structuredQuery }, token)
  return res.body
}

async function patchDoc(token, docPath, fields, updateMask) {
  const maskParams = updateMask.map(f => `updateMask.fieldPaths=${f}`).join('&')
  const res = await request('PATCH', `${BASE}/${docPath}?${maskParams}`, { fields }, token)
  return res
}

async function main() {
  const token = getToken()

  if (revert) {
    if (!fs.existsSync(BACKUP_FILE)) { console.log('No backup — nothing to revert.'); return }
    const { id, original } = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'))
    await patchDoc(token, `matches/${id}`, {
      status: { stringValue: original.status },
      homeScore: original.homeScore !== null ? { integerValue: original.homeScore } : { nullValue: null },
      awayScore: original.awayScore !== null ? { integerValue: original.awayScore } : { nullValue: null },
    }, ['status', 'homeScore', 'awayScore'])
    fs.unlinkSync(BACKUP_FILE)
    console.log(`Reverted match ${id}.`)
    return
  }

  const results = await runQuery(token, {
    from: [{ collectionId: 'matches' }],
    where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'upcoming' } } },
    orderBy: [{ field: { fieldPath: 'date' }, direction: 'ASCENDING' }],
    limit: 1,
  })

  const doc = results[0]?.document
  if (!doc) { console.log('No upcoming matches found.'); return }

  const docId = doc.name.split('/').pop()
  const fields = doc.fields
  const origStatus = fields.status?.stringValue ?? 'upcoming'
  const origHome = fields.homeScore?.integerValue ?? null
  const origAway = fields.awayScore?.integerValue ?? null

  fs.writeFileSync(BACKUP_FILE, JSON.stringify({ id: docId, original: { status: origStatus, homeScore: origHome, awayScore: origAway } }, null, 2))

  await patchDoc(token, `matches/${docId}`, {
    status: { stringValue: 'live' },
    homeScore: { integerValue: 2 },
    awayScore: { integerValue: 1 },
  }, ['status', 'homeScore', 'awayScore'])

  const home = fields.homeTeamId?.stringValue ?? '?'
  const away = fields.awayTeamId?.stringValue ?? '?'
  console.log(`Match ${docId} (${home} vs ${away}) → LIVE 2–1`)
  console.log('Run with --revert to restore.')
}

main().catch(console.error)
