const assert = require('node:assert/strict')

const teams = require('../src/data/worldCup2026Teams.json')
const matches = require('../src/data/worldCup2026GroupMatches.json')
const { previewLocalFixtureMatch } = require('../functions/lib/sync.js')

const spainCapeVerdeFixture = {
  fixture: {
    id: 1489380,
    date: '2026-06-15T16:00:00Z',
    status: {
      short: '1H',
      elapsed: 37,
      extra: null,
    },
    venue: {
      name: 'Atlanta Stadium',
      city: 'Atlanta',
    },
  },
  league: {
    id: 1,
    season: 2026,
    round: 'Group Stage - 1',
  },
  teams: {
    home: { id: 9, name: 'Spain', winner: null },
    away: { id: 1530, name: 'Cape Verde Islands', winner: null },
  },
  goals: {
    home: 1,
    away: 0,
  },
  score: {
    fulltime: {
      home: null,
      away: null,
    },
  },
}

function assertLivePatch(result) {
  assert.ok(result, 'fixture should map to a local match')
  assert.equal(result.matchId, 'match-014')
  assert.equal(result.patch.homeTeamId, 'spain')
  assert.equal(result.patch.awayTeamId, 'cabo-verde')
  assert.equal(result.patch.apiFootballFixtureId, 1489380)
  assert.equal(result.patch.status, 'live')
  assert.equal(result.patch.statusShort, '1H')
  assert.equal(result.patch.minute, 37)
  assert.equal(result.patch.homeScore, 1)
  assert.equal(result.patch.awayScore, 0)
}

const caboVerde = teams.find((team) => team.id === 'cabo-verde')
assert.deepEqual(caboVerde?.apiFootballAliases, ['Cape Verde', 'Cape Verde Islands'])

assertLivePatch(previewLocalFixtureMatch(spainCapeVerdeFixture, teams, matches))

const teamsWithoutStoredIslandsAlias = teams.map((team) => (
  team.id === 'cabo-verde'
    ? { ...team, apiFootballAliases: ['Cape Verde'] }
    : team
))
assertLivePatch(previewLocalFixtureMatch(spainCapeVerdeFixture, teamsWithoutStoredIslandsAlias, matches))

console.log('Live results regression OK: Spain vs Cape Verde Islands maps to match-014 and yields a live score patch.')
