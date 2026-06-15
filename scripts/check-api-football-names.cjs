const fs = require('node:fs')
const https = require('node:https')
const path = require('node:path')

const {
  API_NAME_ALIASES,
  buildLocalTeamNameMap,
  normalizeName,
  previewLocalFixtureMatch,
  toLocalTeamId,
} = require('../functions/lib/sync.js')

const DEFAULT_LEAGUE = 1
const DEFAULT_SEASON = 2026
const DEFAULT_TEAMS_PATH = 'src/data/worldCup2026Teams.json'
const DEFAULT_MATCHES_PATH = 'src/data/worldCup2026GroupMatches.json'
const API_BASE = 'https://v3.football.api-sports.io'

function usageAndExit(message) {
  if (message) console.error(message)
  console.error([
    'Usage: npm run check:api-football-names -- [options]',
    '',
    'Options:',
    '  --league <id>             API-Football league id (default: 1)',
    '  --season <year>           API-Football season (default: 2026)',
    '  --teams <path>            Local teams JSON path',
    '  --matches <path>          Local matches JSON path',
    '  --fixture-file <path>     Offline API-Football fixtures JSON',
    '  --allow-extra-fixtures    Do not fail when API has fixtures outside the local schedule',
    '  --skip-date-check         Do not compare API kickoff date with local dateUtc',
  ].join('\n'))
  process.exit(1)
}

function takeValue(argv, index, flag) {
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) usageAndExit(`${flag} requires a value.`)
  return value
}

function parseArgs(argv) {
  const options = {
    league: DEFAULT_LEAGUE,
    season: DEFAULT_SEASON,
    teamsPath: DEFAULT_TEAMS_PATH,
    matchesPath: DEFAULT_MATCHES_PATH,
    fixtureFile: null,
    allowExtraFixtures: false,
    skipDateCheck: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--league') {
      options.league = Number(takeValue(argv, i, arg))
      i += 1
    } else if (arg.startsWith('--league=')) {
      options.league = Number(arg.slice('--league='.length))
    } else if (arg === '--season') {
      options.season = Number(takeValue(argv, i, arg))
      i += 1
    } else if (arg.startsWith('--season=')) {
      options.season = Number(arg.slice('--season='.length))
    } else if (arg === '--teams') {
      options.teamsPath = takeValue(argv, i, arg)
      i += 1
    } else if (arg.startsWith('--teams=')) {
      options.teamsPath = arg.slice('--teams='.length)
    } else if (arg === '--matches') {
      options.matchesPath = takeValue(argv, i, arg)
      i += 1
    } else if (arg.startsWith('--matches=')) {
      options.matchesPath = arg.slice('--matches='.length)
    } else if (arg === '--fixture-file') {
      options.fixtureFile = takeValue(argv, i, arg)
      i += 1
    } else if (arg.startsWith('--fixture-file=')) {
      options.fixtureFile = arg.slice('--fixture-file='.length)
    } else if (arg === '--allow-extra-fixtures') {
      options.allowExtraFixtures = true
    } else if (arg === '--skip-date-check') {
      options.skipDateCheck = true
    } else if (arg === '--help' || arg === '-h') {
      usageAndExit()
    } else {
      usageAndExit(`Unknown option: ${arg}`)
    }
  }

  if (!Number.isInteger(options.league) || options.league <= 0) usageAndExit('--league must be a positive integer.')
  if (!Number.isInteger(options.season) || options.season <= 0) usageAndExit('--season must be a positive integer.')
  return options
}

function readJsonFile(filePath) {
  const resolved = path.resolve(filePath)
  return JSON.parse(fs.readFileSync(resolved, 'utf8'))
}

function fixturesFromPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.response)) return payload.response
  throw new Error('Fixture JSON must be an array or an object with a response array.')
}

function requestJson(url, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let body
        try {
          body = data ? JSON.parse(data) : {}
        } catch (error) {
          reject(new Error(`API-Football returned non-JSON response: ${error.message}`))
          return
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`API-Football returned HTTP ${res.statusCode}.`))
          return
        }
        resolve(body)
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function loadFixtures(options) {
  if (options.fixtureFile) {
    return {
      source: `fixture file ${path.resolve(options.fixtureFile)}`,
      fixtures: fixturesFromPayload(readJsonFile(options.fixtureFile)),
    }
  }

  if (process.env.API_FOOTBALL_FIXTURES_JSON) {
    return {
      source: 'API_FOOTBALL_FIXTURES_JSON',
      fixtures: fixturesFromPayload(JSON.parse(process.env.API_FOOTBALL_FIXTURES_JSON)),
    }
  }

  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is required unless --fixture-file or API_FOOTBALL_FIXTURES_JSON is provided.')
  }

  const url = new URL(`${API_BASE}/fixtures`)
  url.searchParams.set('league', String(options.league))
  url.searchParams.set('season', String(options.season))

  return {
    source: `API-Football league ${options.league} season ${options.season}`,
    fixtures: fixturesFromPayload(await requestJson(url, apiKey)),
  }
}

function fixtureId(fixture) {
  return fixture?.fixture?.id ?? 'unknown'
}

function fixtureDate(fixture) {
  return fixture?.fixture?.date ?? 'unknown date'
}

function teamName(fixture, side) {
  return fixture?.teams?.[side]?.name ?? ''
}

function describeFixture(fixture) {
  const home = teamName(fixture, 'home') || 'unknown home'
  const away = teamName(fixture, 'away') || 'unknown away'
  return `#${fixtureId(fixture)} ${home} vs ${away} at ${fixtureDate(fixture)}`
}

function collectAliasEntries(teams) {
  const entries = []
  for (const team of teams) {
    if (team.name) {
      entries.push({
        normalized: normalizeName(team.name),
        label: team.name,
        teamId: team.id,
        source: 'team name',
      })
    }
    for (const alias of team.apiFootballAliases ?? []) {
      entries.push({
        normalized: normalizeName(alias),
        label: alias,
        teamId: team.id,
        source: 'apiFootballAliases',
      })
    }
  }

  for (const [alias, teamId] of Object.entries(API_NAME_ALIASES)) {
    entries.push({
      normalized: normalizeName(alias),
      label: alias,
      teamId,
      source: 'fallback alias',
    })
  }
  return entries
}

function findAmbiguousAliases(teams) {
  const byName = new Map()
  for (const entry of collectAliasEntries(teams)) {
    if (!entry.normalized) continue
    const existing = byName.get(entry.normalized) ?? []
    existing.push(entry)
    byName.set(entry.normalized, existing)
  }

  return Array.from(byName.entries())
    .map(([normalized, entries]) => ({
      normalized,
      entries,
      teamIds: Array.from(new Set(entries.map((entry) => entry.teamId))),
    }))
    .filter((group) => group.teamIds.length > 1)
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = Array.from({ length: b.length + 1 }, () => 0)

  for (let i = 0; i < a.length; i += 1) {
    current[0] = i + 1
    for (let j = 0; j < b.length; j += 1) {
      const substitution = previous[j] + (a[i] === b[j] ? 0 : 1)
      const insertion = current[j] + 1
      const deletion = previous[j + 1] + 1
      current[j + 1] = Math.min(substitution, insertion, deletion)
    }
    for (let j = 0; j < previous.length; j += 1) previous[j] = current[j]
  }

  return previous[b.length]
}

function tokenScore(query, candidate) {
  const queryTokens = new Set(query.split(' ').filter(Boolean))
  const candidateTokens = new Set(candidate.split(' ').filter(Boolean))
  if (queryTokens.size === 0 || candidateTokens.size === 0) return 0

  let shared = 0
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) shared += 1
  }
  return shared / Math.max(queryTokens.size, candidateTokens.size)
}

function fuzzyScore(query, candidate) {
  if (!query || !candidate) return 0
  const distanceScore = 1 - (levenshtein(query, candidate) / Math.max(query.length, candidate.length))
  const containsScore = query.includes(candidate) || candidate.includes(query) ? 0.9 : 0
  return Math.max(distanceScore, containsScore, tokenScore(query, candidate))
}

function suggestionsFor(name, teams) {
  const query = normalizeName(name)
  const suggestions = []

  for (const team of teams) {
    const labels = [team.name, ...(team.apiFootballAliases ?? [])].filter(Boolean)
    let best = null
    for (const label of labels) {
      const score = fuzzyScore(query, normalizeName(label))
      if (!best || score > best.score) best = { label, score }
    }
    if (best && best.score >= 0.25) {
      suggestions.push({
        teamId: team.id,
        teamName: team.name ?? team.id,
        label: best.label,
        score: best.score,
      })
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score || a.teamName.localeCompare(b.teamName))
    .slice(0, 5)
}

function printUnknowns(unknowns, teams) {
  if (unknowns.size === 0) return

  console.error('\nUnknown API-Football team names:')
  for (const unknown of unknowns.values()) {
    const firstFixture = unknown.fixtures[0]
    console.error(`- "${unknown.name}"`)
    console.error(`  Fixture: ${describeFixture(firstFixture)}`)
    const suggestions = suggestionsFor(unknown.name, teams)
    if (suggestions.length > 0) {
      console.error(`  Likely local teams: ${suggestions.map((suggestion) => `${suggestion.teamName} (${suggestion.teamId}; matched "${suggestion.label}")`).join(', ')}`)
    }
    console.error(`  Add "${unknown.name}" to apiFootballAliases for the correct local team.`)
  }
}

function printInactiveMappings(inactiveMappings) {
  if (inactiveMappings.length === 0) return

  console.error('\nAPI names mapped outside the active local team list:')
  for (const item of inactiveMappings) {
    console.error(`- "${item.apiName}" mapped to "${item.localTeamId}" in ${describeFixture(item.fixture)}`)
  }
}

function printExtraFixtures(extraFixtures) {
  if (extraFixtures.length === 0) return

  console.error('\nAPI fixtures missing from the local match schedule:')
  for (const item of extraFixtures) {
    console.error(`- ${describeFixture(item.fixture)} mapped to ${item.homeTeamId} vs ${item.awayTeamId}`)
  }
}

function printDateMismatches(dateMismatches) {
  if (dateMismatches.length === 0) return

  console.error('\nAPI fixture kickoff times that differ from local dateUtc:')
  for (const item of dateMismatches) {
    console.error(`- ${describeFixture(item.fixture)} -> ${item.match.id}`)
    console.error(`  API:   ${item.apiDate}`)
    console.error(`  Local: ${item.localDate}`)
  }
}

function printAmbiguousAliases(ambiguousAliases) {
  if (ambiguousAliases.length === 0) return

  console.error('\nAmbiguous local aliases:')
  for (const group of ambiguousAliases) {
    console.error(`- "${group.normalized}" maps to multiple teams:`)
    for (const entry of group.entries) {
      console.error(`  ${entry.teamId} via ${entry.source} "${entry.label}"`)
    }
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be a JSON array.`)
  return value
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const teams = requireArray(readJsonFile(options.teamsPath), 'Teams file')
  const matches = requireArray(readJsonFile(options.matchesPath), 'Matches file')
  const activeTeamIds = new Set(teams.map((team) => team.id))
  const matchesById = new Map(matches.map((match) => [match.id, match]))
  const teamNameMap = buildLocalTeamNameMap(teams)
  const ambiguousAliases = findAmbiguousAliases(teams)
  const { source, fixtures } = await loadFixtures(options)

  if (fixtures.length === 0) {
    throw new Error(`No fixtures found in ${source}.`)
  }

  const unknowns = new Map()
  const inactiveMappings = []
  const extraFixtures = []
  const dateMismatches = []
  let scheduledFixtures = 0
  let dateChecks = 0

  for (const fixture of fixtures) {
    const resolved = {}
    for (const side of ['home', 'away']) {
      const apiName = teamName(fixture, side)
      const normalized = normalizeName(apiName)
      const localTeamId = apiName ? toLocalTeamId(apiName, teamNameMap) : null
      resolved[side] = localTeamId

      if (!localTeamId) {
        const unknown = unknowns.get(normalized) ?? { name: apiName || '(missing name)', fixtures: [] }
        unknown.fixtures.push(fixture)
        unknowns.set(normalized, unknown)
      } else if (!activeTeamIds.has(localTeamId)) {
        inactiveMappings.push({ apiName, localTeamId, fixture })
      }
    }

    if (!resolved.home || !resolved.away) continue
    if (!activeTeamIds.has(resolved.home) || !activeTeamIds.has(resolved.away)) continue

    const mapped = previewLocalFixtureMatch(fixture, teams, matches)
    if (!mapped) {
      if (!options.allowExtraFixtures) {
        extraFixtures.push({
          fixture,
          homeTeamId: resolved.home,
          awayTeamId: resolved.away,
        })
      }
      continue
    }

    scheduledFixtures += 1
    if (options.skipDateCheck) continue

    const match = matchesById.get(mapped.matchId)
    const apiMs = Date.parse(fixtureDate(fixture))
    const localMs = Date.parse(match?.dateUtc ?? '')
    if (!Number.isFinite(apiMs) || !Number.isFinite(localMs) || apiMs !== localMs) {
      dateMismatches.push({
        fixture,
        match,
        apiDate: Number.isFinite(apiMs) ? new Date(apiMs).toISOString() : fixtureDate(fixture),
        localDate: Number.isFinite(localMs) ? new Date(localMs).toISOString() : match?.dateUtc ?? '(missing local dateUtc)',
      })
    } else {
      dateChecks += 1
    }
  }

  const failureCount = unknowns.size
    + inactiveMappings.length
    + extraFixtures.length
    + dateMismatches.length
    + ambiguousAliases.length

  if (failureCount > 0) {
    console.error(`API-Football team-name check failed for ${source}.`)
    printAmbiguousAliases(ambiguousAliases)
    printUnknowns(unknowns, teams)
    printInactiveMappings(inactiveMappings)
    printExtraFixtures(extraFixtures)
    printDateMismatches(dateMismatches)
    process.exit(1)
  }

  console.log('API-Football team-name check OK.')
  console.log(`Source: ${source}`)
  console.log(`Fixtures checked: ${fixtures.length}`)
  console.log(`Fixtures matched to local schedule: ${scheduledFixtures}`)
  if (options.allowExtraFixtures) console.log('Extra API fixtures allowed: yes')
  if (options.skipDateCheck) console.log('Date check skipped: yes')
  else console.log(`Kickoff dates checked: ${dateChecks}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
