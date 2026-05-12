// Creates one test match at 04:00 CEST using teams other than Belgium/England.
// node scripts/create-midnight-test.cjs          — create
// node scripts/create-midnight-test.cjs --delete — delete

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const DOC_ID = 'test-match-22pm'
const KICK_OFF = '2026-04-20T20:00:00Z' // 22:00 CEST

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

async function getTeams(token) {
  const res = await request('GET', `${BASE}/teams?pageSize=10`, null, token)
  return (res.body.documents ?? []).map(d => ({
    id: d.name.split('/').pop(),
    name: d.fields.name?.stringValue ?? 'Team',
    flag: d.fields.flag?.stringValue ?? '🏳️',
    group: d.fields.group?.stringValue ?? 'A',
  }))
}

async function main() {
  const token = getToken()

  if (process.argv.includes('--delete')) {
    const res = await request('DELETE', `${BASE}/matches/${DOC_ID}`, null, token)
    console.log(res.status === 200 ? `Deleted ${DOC_ID}` : `${res.status} — ${JSON.stringify(res.body)}`)
    return
  }

  const teams = await getTeams(token)
  // Skip Belgium and England (first two), pick the next two
  const [home, away] = teams.filter(t => t.name !== 'Belgium' && t.name !== 'England').slice(0, 2)
  if (!home || !away) { console.error('Could not find suitable teams'); process.exit(1) }

  const fields = {
    status: { stringValue: 'upcoming' },
    date: { timestampValue: KICK_OFF },
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
  const res = await request('PATCH', `${BASE}/matches/${DOC_ID}?${maskParams}`, { fields }, token)
  if (res.status === 200) console.log(`Created ${DOC_ID}: ${home.flag} ${home.name} vs ${away.flag} ${away.name} — kickoff ${KICK_OFF}`)
  else console.log(`${res.status} — ${JSON.stringify(res.body)}`)
}

main().catch(console.error)
