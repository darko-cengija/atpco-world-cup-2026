#!/usr/bin/env node

const teamsJson = require('../src/data/worldCup2026Teams.json')
const groupMatchesJson = require('../src/data/worldCup2026GroupMatches.json')
const { __winningChancesTest } = require('../functions/lib/winningChances.js')

const DEFAULT_ITERATIONS = 10000
const BASELINE_SEED = 20261001
const SIMULATION_SEED = 20262001
const SNAPSHOTS = [36, 100]

function parseIterations() {
  const arg = process.argv.find((value) => value.startsWith('--iterations='))
  if (!arg) return DEFAULT_ITERATIONS
  const value = Number(arg.split('=')[1])
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('--iterations must be a positive integer')
  }
  return value
}

function toTeamRows() {
  return teamsJson.map((team) => ({
    id: team.id,
    name: team.name,
    group: team.group,
    fifaRank: team.fifaRank,
  }))
}

function toGroupMatchRows(fixedByMatchNumber = new Map()) {
  return groupMatchesJson.map((match) => {
    const fixed = fixedByMatchNumber.get(match.matchNumber)
    if (fixed) return toFixedMatchRow(fixed)

    return {
      id: match.id,
      matchNumber: match.matchNumber,
      stage: 'Group Stage',
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      status: 'upcoming',
      date: new Date(match.dateUtc),
      homeScore: null,
      awayScore: null,
      regularTimeScoreHome: null,
      regularTimeScoreAway: null,
      qualifier: null,
    }
  })
}

function toFixedMatchRow(match) {
  const tiedKnockout = match.stage !== 'Group Stage' && match.homeScore === match.awayScore
  const qualifier = tiedKnockout
    ? match.winnerTeamId === match.homeTeamId ? 'home' : 'away'
    : null

  return {
    id: `fixed-${String(match.matchNumber).padStart(3, '0')}`,
    matchNumber: match.matchNumber,
    stage: match.stage,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    status: 'finished',
    date: null,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    regularTimeScoreHome: null,
    regularTimeScoreAway: null,
    qualifier,
  }
}

function buildPlayers(teams) {
  const fixedTeamIds = new Set()
  const players = [
    {
      userId: 'darko',
      displayName: 'Darko',
      avatarUrl: null,
      teamIds: ['croatia', 'germany', 'czechia', 'sweden', 'congo-dr', 'curacao'],
    },
    {
      userId: 'leon',
      displayName: 'Leon',
      avatarUrl: null,
      teamIds: ['spain', 'senegal', 'korea-republic', 'canada', 'ghana', 'iraq'],
    },
    { userId: 'vibor', displayName: 'Vibor', avatarUrl: null, teamIds: [] },
    { userId: 'karmela', displayName: 'Karmela', avatarUrl: null, teamIds: [] },
    { userId: 'danijel', displayName: 'Danijel', avatarUrl: null, teamIds: [] },
    { userId: 'marko', displayName: 'Marko', avatarUrl: null, teamIds: [] },
    { userId: 'george-belt', displayName: 'George Belt', avatarUrl: null, teamIds: [] },
    { userId: 'vanesa', displayName: 'Vanesa', avatarUrl: null, teamIds: [] },
  ]

  for (const player of players.slice(0, 2)) {
    for (const teamId of player.teamIds) fixedTeamIds.add(teamId)
  }

  const remainingPlayers = players.slice(2)
  const remainingTeams = teams
    .filter((team) => !fixedTeamIds.has(team.id))
    .sort((a, b) => (a.fifaRank ?? 999) - (b.fifaRank ?? 999))

  for (const [index, team] of remainingTeams.entries()) {
    remainingPlayers[index % remainingPlayers.length].teamIds.push(team.id)
  }

  return players
}

function buildProbabilities(matches, teams) {
  const probabilities = new Map()
  __winningChancesTest.fillRankFallbackProbabilities(matches, teams, probabilities)
  return probabilities
}

function baselineTournament(teams) {
  const matches = toGroupMatchRows()
  const probabilities = buildProbabilities(matches, teams)
  return __winningChancesTest.simulateTournament(
    matches,
    teams,
    new Map(),
    probabilities,
    new Map(teams.map((team) => [team.id, team])),
    BASELINE_SEED,
  )
}

function buildSnapshotMatches(baselinePlayed, finishedThrough) {
  const fixedByMatchNumber = new Map(
    baselinePlayed
      .filter((match) => match.matchNumber <= finishedThrough)
      .map((match) => [match.matchNumber, match]),
  )
  const matches = toGroupMatchRows(fixedByMatchNumber)

  for (const match of baselinePlayed) {
    if (match.matchNumber <= 72 || match.matchNumber > finishedThrough) continue
    matches.push(toFixedMatchRow(match))
  }

  return matches.sort((a, b) => a.matchNumber - b.matchNumber)
}

function matchSignature(match) {
  return [
    match.matchNumber,
    match.stage,
    match.homeTeamId,
    match.awayTeamId,
    match.homeScore,
    match.awayScore,
    match.winnerTeamId ?? 'draw',
  ].join(':')
}

function signatureForRange(played, predicate) {
  return played
    .filter(predicate)
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map(matchSignature)
    .join('|')
}

function pointsFromPlayed(player, played) {
  const owned = new Set(player.teamIds)
  let points = 0

  for (const match of played) {
    const isHome = owned.has(match.homeTeamId)
    const isAway = owned.has(match.awayTeamId)
    if (!isHome && !isAway) continue

    const gf = isHome ? match.homeScore : match.awayScore
    const ga = isHome ? match.awayScore : match.homeScore
    if (gf > ga) points += 3
    else if (gf === ga) points += 1
  }

  return points
}

function formatNumber(value) {
  return value.toFixed(1).padStart(5, ' ')
}

function runSnapshot({ finishedThrough, iterations, teams, players, baselinePlayed }) {
  const matches = buildSnapshotMatches(baselinePlayed, finishedThrough)
  const fixedByMatchNumber = new Map(
    matches
      .filter((match) => match.status !== 'upcoming' && match.homeScore !== null && match.awayScore !== null)
      .map((match) => [match.matchNumber, match]),
  )
  const probabilities = buildProbabilities(matches, teams)
  const teamById = new Map(teams.map((team) => [team.id, team]))
  const fixedPlayed = baselinePlayed.filter((match) => match.matchNumber <= finishedThrough)
  const expectedFixedSignature = signatureForRange(fixedPlayed, () => true)
  const fixedSignatures = new Set()
  const variableSignatures = new Set()
  const winCounts = new Map(players.map((player) => [player.userId, 0]))
  const pointTotals = new Map(players.map((player) => [player.userId, 0]))
  const actualPoints = new Map(players.map((player) => [player.userId, pointsFromPlayed(player, fixedPlayed)]))
  const futureAppearances = new Map(players.map((player) => [player.userId, 0]))
  const eliminatedFuturePointViolations = []

  for (let index = 0; index < iterations; index++) {
    const { played, eliminationRanks } = __winningChancesTest.simulateTournament(
      matches,
      teams,
      fixedByMatchNumber,
      probabilities,
      teamById,
      SIMULATION_SEED + finishedThrough * 100000 + index,
    )
    const fixedSignature = signatureForRange(played, (match) => match.matchNumber <= finishedThrough)
    const variableSignature = signatureForRange(played, (match) => match.matchNumber > finishedThrough)
    fixedSignatures.add(fixedSignature)
    variableSignatures.add(variableSignature)

    if (fixedSignature !== expectedFixedSignature) {
      throw new Error(`Fixed-match signature changed for N=${finishedThrough} on iteration ${index}`)
    }

    const futurePlayed = played.filter((match) => match.matchNumber > finishedThrough)
    const standings = players
      .map((player) => __winningChancesTest.playerStanding(player, played, eliminationRanks))
      .sort(__winningChancesTest.comparePlayerStandings)
    const winner = standings[0]
    winCounts.set(winner.player.userId, (winCounts.get(winner.player.userId) ?? 0) + 1)

    for (const standing of standings) {
      const player = standing.player
      const futurePoints = standing.points - (actualPoints.get(player.userId) ?? 0)
      const appearsInFuture = futurePlayed.some((match) =>
        player.teamIds.includes(match.homeTeamId) || player.teamIds.includes(match.awayTeamId),
      )

      if (appearsInFuture) futureAppearances.set(player.userId, (futureAppearances.get(player.userId) ?? 0) + 1)
      if (!appearsInFuture && futurePoints !== 0) {
        eliminatedFuturePointViolations.push({
          iteration: index,
          player: player.displayName,
          futurePoints,
        })
      }

      pointTotals.set(player.userId, (pointTotals.get(player.userId) ?? 0) + standing.points)
    }
  }

  if (fixedSignatures.size !== 1) {
    throw new Error(`Expected exactly one fixed signature for N=${finishedThrough}, got ${fixedSignatures.size}`)
  }
  if (variableSignatures.size <= 1) {
    throw new Error(`Expected upcoming matches to vary for N=${finishedThrough}`)
  }
  if (eliminatedFuturePointViolations.length > 0) {
    const first = eliminatedFuturePointViolations[0]
    throw new Error(
      `Eliminated player received future points for N=${finishedThrough}: ${first.player} in iteration ${first.iteration}`,
    )
  }

  const rows = players
    .map((player) => {
      const expectedPoints = (pointTotals.get(player.userId) ?? 0) / iterations
      const actual = actualPoints.get(player.userId) ?? 0
      const alivePercent = ((futureAppearances.get(player.userId) ?? 0) / iterations) * 100
      return {
        displayName: player.displayName,
        actual,
        expectedPoints,
        futurePoints: expectedPoints - actual,
        winPercent: ((winCounts.get(player.userId) ?? 0) / iterations) * 100,
        alivePercent,
      }
    })
    .sort((a, b) => b.winPercent - a.winPercent || b.expectedPoints - a.expectedPoints)

  console.log(`\nSnapshot N=${finishedThrough}`)
  console.log(`  fixed matches: ${fixedPlayed.length}`)
  console.log(`  fixed signature variants: ${fixedSignatures.size}`)
  console.log(`  upcoming signature variants: ${variableSignatures.size}`)
  console.log('  player                 alive%  actual     exp  future    win%')

  for (const row of rows) {
    console.log(
      `  ${row.displayName.padEnd(20)} ${formatNumber(row.alivePercent)}% ${String(row.actual).padStart(7)} ${formatNumber(row.expectedPoints)} ${formatNumber(row.futurePoints)} ${formatNumber(row.winPercent)}%`,
    )
  }
}

function main() {
  const iterations = parseIterations()
  const teams = toTeamRows()
  const players = buildPlayers(teams)
  const baseline = baselineTournament(teams)
  const baselinePlayed = baseline.played.sort((a, b) => a.matchNumber - b.matchNumber)

  console.log(`Winning chances snapshot audit (${iterations.toLocaleString()} iterations)`)
  console.log('Synthetic fixed results are derived from one deterministic baseline tournament.')

  for (const finishedThrough of SNAPSHOTS) {
    runSnapshot({ finishedThrough, iterations, teams, players, baselinePlayed })
  }

  console.log('\nOK: fixed matches stayed fixed, upcoming matches varied, and eliminated teams earned no future points.')
}

main()
