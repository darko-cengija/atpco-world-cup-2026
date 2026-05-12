// Lists all matches in Firestore with key fields for triage.
//
// node scripts/list-matches.cjs

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { requireFirebaseProjectId } = require('./firebase-project.cjs')

const PROJECT_ID = requireFirebaseProjectId()
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`

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
      const f = d.fields ?? {}
      out.push({
        id: d.name.split('/').pop(),
        leagueId: f.leagueId?.integerValue ?? f.leagueId?.stringValue ?? null,
        venue: f.venue?.stringValue ?? '',
        status: f.status?.stringValue ?? '',
        date: f.date?.timestampValue ?? '',
        homeName: f.homeTeam?.mapValue?.fields?.name?.stringValue ?? '?',
        awayName: f.awayTeam?.mapValue?.fields?.name?.stringValue ?? '?',
      })
    }
    nextPageToken = res.body.nextPageToken ?? null
  } while (nextPageToken)
  return out
}

async function main() {
  const token = getToken()
  const all = await listAllMatches(token)
  all.sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const byLeague = {}
  for (const m of all) {
    const key = m.leagueId ?? '(none)'
    byLeague[key] = (byLeague[key] ?? 0) + 1
  }

  console.log(`Total matches: ${all.length}`)
  console.log(`By leagueId: ${JSON.stringify(byLeague)}\n`)

  console.log('All matches (date · leagueId · status · teams · venue · id):')
  for (const m of all) {
    console.log(`  ${m.date} · L${m.leagueId ?? '-'} · ${m.status} · ${m.homeName} vs ${m.awayName} · "${m.venue}" · ${m.id}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
