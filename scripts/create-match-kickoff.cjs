// Deletes all fake matches (venue 'Test Venue') dated today (UTC),
// then creates one at 15:20 UTC on 2026-04-21 (= 17:20 CEST).
//
// node scripts/create-match-kickoff.cjs

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const NEW_MATCH_ID = 'test-match-1720-cest'
const NEW_KICKOFF_UTC = '2026-04-21T15:20:00Z' // 17:20 CEST
const TODAY_UTC_PREFIX = '2026-04-21'

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

async function listAllMatches(token) {
  const out = []
  let nextPageToken = null
  do {
    const qs = nextPageToken ? `?pageSize=300&pageToken=${encodeURIComponent(nextPageToken)}` : '?pageSize=300'
    const res = await request('GET', `${BASE}/matches${qs}`, null, token)
    const docs = res.body.documents ?? []
    for (const d of docs) {
      out.push({
        id: d.name.split('/').pop(),
        venue: d.fields.venue?.stringValue ?? '',
        date: d.fields.date?.timestampValue ?? '',
      })
    }
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)
  return out
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
  const maskParams = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&')
  return request('PATCH', `${BASE}/matches/${docId}?${maskParams}`, { fields }, token)
}

async function deleteMatch(token, docId) {
  return request('DELETE', `${BASE}/matches/${docId}`, null, token)
}

async function main() {
  const token = getToken()

  console.log('Listing matches…')
  const all = await listAllMatches(token)
  const fakeToday = all.filter(m => m.venue === 'Test Venue' && m.date.startsWith(TODAY_UTC_PREFIX))
  console.log(`Found ${fakeToday.length} fake matches today:`)
  for (const m of fakeToday) console.log(`  - ${m.id} @ ${m.date}`)

  for (const m of fakeToday) {
    const res = await deleteMatch(token, m.id)
    console.log(res.status === 200 ? `Deleted ${m.id}` : `${m.id}: ${res.status} — ${JSON.stringify(res.body)}`)
  }

  const teams = await getFirstTwoTeams(token)
  if (teams.length < 2) { console.error('Could not fetch 2 teams from Firestore'); process.exit(1) }
  const [home, away] = teams
  console.log(`\nUsing teams: ${home.flag} ${home.name} vs ${away.flag} ${away.name}`)

  const res = await createMatch(token, NEW_MATCH_ID, NEW_KICKOFF_UTC, home, away)
  console.log(res.status === 200
    ? `Created ${NEW_MATCH_ID} — kickoff ${NEW_KICKOFF_UTC} (17:20 CEST)`
    : `Failed: ${res.status} — ${JSON.stringify(res.body)}`)
}

main().catch(err => { console.error(err); process.exit(1) })
