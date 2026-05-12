// Creates 3 fake upcoming matches for testing push notification reminders.
// node scripts/create-test-matches.cjs          — create
// node scripts/create-test-matches.cjs --delete — delete

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// Match IDs so we can easily delete them later
const TEST_IDS = ['test-match-1am', 'test-match-2am', 'test-match-3am']

// 1:00, 2:00, 3:00 AM CEST (UTC+2) on April 20
const KICK_OFFS = [
  '2026-04-19T23:00:00Z', // 01:00 CEST
  '2026-04-20T00:00:00Z', // 02:00 CEST
  '2026-04-20T01:00:00Z', // 03:00 CEST
]

const LABELS = ['01:00 CEST', '02:00 CEST', '03:00 CEST']

function getToken() {
  const data = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'))
  return data.tokens.access_token
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
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function getFirstTwoTeams(token) {
  const res = await request('GET', `${BASE}/teams?pageSize=2`, null, token)
  const docs = res.body.documents ?? []
  return docs.map(d => ({
    id: d.name.split('/').pop(),
    name: d.fields.name?.stringValue ?? 'Team',
    flag: d.fields.flag?.stringValue ?? '🏳️',
    group: d.fields.group?.stringValue ?? 'A',
  }))
}

async function createMatch(token, docId, kickoff, home, away) {
  const fields = {
    status: { stringValue: 'upcoming' },
    date: { timestampValue: kickoff },
    homeTeamId: { stringValue: home.id },
    awayTeamId: { stringValue: away.id },
    homeTeam: { mapValue: { fields: {
      id: { stringValue: home.id },
      name: { stringValue: home.name },
      flag: { stringValue: home.flag },
      group: { stringValue: home.group },
    }}},
    awayTeam: { mapValue: { fields: {
      id: { stringValue: away.id },
      name: { stringValue: away.name },
      flag: { stringValue: away.flag },
      group: { stringValue: away.group },
    }}},
    venue: { stringValue: 'Test Venue' },
    stage: { stringValue: 'Group Stage' },
    homeScore: { nullValue: null },
    awayScore: { nullValue: null },
    qualifier: { nullValue: null },
  }

  // Use PATCH with documentId to set a specific ID
  const maskParams = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&')
  const res = await request(
    'PATCH',
    `${BASE}/matches/${docId}?${maskParams}`,
    { fields },
    token,
  )
  return res
}

async function deleteMatch(token, docId) {
  return request('DELETE', `${BASE}/matches/${docId}`, null, token)
}

async function main() {
  const token = getToken()
  const isDelete = process.argv.includes('--delete')

  if (isDelete) {
    for (const id of TEST_IDS) {
      const res = await deleteMatch(token, id)
      if (res.status === 200) console.log(`Deleted ${id}`)
      else console.log(`${id}: ${res.status} — ${JSON.stringify(res.body)}`)
    }
    return
  }

  const teams = await getFirstTwoTeams(token)
  if (teams.length < 2) { console.error('Could not fetch 2 teams from Firestore'); process.exit(1) }
  const [home, away] = teams
  console.log(`Using teams: ${home.flag} ${home.name} vs ${away.flag} ${away.name}`)

  for (let i = 0; i < 3; i++) {
    const res = await createMatch(token, TEST_IDS[i], KICK_OFFS[i], home, away)
    if (res.status === 200) console.log(`Created ${TEST_IDS[i]} — kickoff ${LABELS[i]}`)
    else console.log(`${TEST_IDS[i]}: ${res.status} — ${JSON.stringify(res.body)}`)
  }

  console.log('\nDone. To clean up: node scripts/create-test-matches.cjs --delete')
}

main().catch(console.error)
