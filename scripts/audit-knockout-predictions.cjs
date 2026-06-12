#!/usr/bin/env node

const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

function closeEnough(actual, expected) {
  assert.equal(Math.round(actual * 1000000), Math.round(expected * 1000000))
}

function freshPoints(userIds) {
  return Object.fromEntries(userIds.map((userId) => [userId, 0]))
}

function printPoints(label, points) {
  console.log(`  ${label}`)
  for (const [userId, score] of Object.entries(points)) {
    console.log(`    ${userId}: ${score.toFixed(2)}`)
  }
}

function fixture({
  short,
  fulltimeHome,
  fulltimeAway,
  goalsHome,
  goalsAway,
  winner,
}) {
  return {
    fixture: {
      id: 1,
      date: '2026-07-04T19:00:00Z',
      status: { short, elapsed: null },
    },
    league: { id: 1, season: 2026, round: 'Round of 16' },
    teams: {
      home: { id: 1, name: 'Home', winner: winner === 'home' },
      away: { id: 2, name: 'Away', winner: winner === 'away' },
    },
    goals: { home: goalsHome, away: goalsAway },
    score: {
      fulltime: { home: fulltimeHome, away: fulltimeAway },
    },
  }
}

async function main() {
  const helperUrl = pathToFileURL(path.resolve(__dirname, '../src/lib/predictions.ts')).href
  const { actualOutcome, applyPredictionScore } = await import(helperUrl)
  const { __syncTest } = require('../functions/lib/sync.js')
  const userIds = ['ana', 'boris', 'cora', 'darko']

  console.log('Knockout prediction audit')

  assert.equal(__syncTest.getQualifier(fixture({
    short: 'AET',
    fulltimeHome: 1,
    fulltimeAway: 1,
    goalsHome: 2,
    goalsAway: 1,
    winner: 'home',
  }), 'Round of 16'), 'home')
  assert.equal(__syncTest.getQualifier(fixture({
    short: 'AET',
    fulltimeHome: 1,
    fulltimeAway: 1,
    goalsHome: 1,
    goalsAway: 2,
    winner: 'away',
  }), 'Round of 16'), 'away')
  assert.equal(__syncTest.getQualifier(fixture({
    short: 'FT',
    fulltimeHome: 2,
    fulltimeAway: 1,
    goalsHome: 2,
    goalsAway: 1,
    winner: 'home',
  }), 'Round of 16'), null)
  assert.equal(__syncTest.getQualifier(fixture({
    short: 'PEN',
    fulltimeHome: 1,
    fulltimeAway: 1,
    goalsHome: 1,
    goalsAway: 1,
    winner: 'away',
  }), 'Round of 16'), 'away')
  assert.equal(__syncTest.getQualifier(fixture({
    short: 'PEN',
    fulltimeHome: 0,
    fulltimeAway: 0,
    goalsHome: 0,
    goalsAway: 0,
    winner: 'home',
  }), 'Round of 16'), 'home')
  console.log('  sync qualifiers: OK')

  assert.equal(actualOutcome(2, 1, null), '1')
  assert.equal(actualOutcome(1, 1, null), 'X')
  assert.equal(actualOutcome(1, 2, null), '2')
  assert.equal(actualOutcome(2, 2, 'home'), 'X1')
  assert.equal(actualOutcome(1, 1, 'away'), 'X2')
  assert.equal(actualOutcome(3, 2, 'home'), 'X1')
  assert.equal(actualOutcome(2, 3, 'away'), 'X2')
  console.log('  outcomes: OK')

  {
    const points = freshPoints(userIds)
    const outcome = actualOutcome(1, 1, 'home')
    applyPredictionScore(userIds, points, [
      { userId: 'ana', outcome: 'X1' },
      { userId: 'boris', outcome: 'X2' },
      { userId: 'cora', outcome: '1' },
    ], outcome)

    closeEnough(points.ana, 4)
    closeEnough(points.boris, 0)
    closeEnough(points.cora, 0)
    closeEnough(points.darko, 0)
    printPoints('home advances after ET/PEN: only X1 scores', points)
  }

  {
    const points = freshPoints(userIds)
    const outcome = actualOutcome(2, 2, 'away')
    applyPredictionScore(userIds, points, [
      { userId: 'ana', outcome: 'X1' },
      { userId: 'boris', outcome: 'X2' },
      { userId: 'cora', outcome: 'X2' },
      { userId: 'darko', outcome: '2' },
    ], outcome)

    closeEnough(points.ana, 0)
    closeEnough(points.boris, 2)
    closeEnough(points.cora, 2)
    closeEnough(points.darko, 0)
    printPoints('away advances after ET/PEN: X2 scorers split points', points)
  }

  {
    const points = freshPoints(userIds)
    const outcome = actualOutcome(0, 0, 'home')
    applyPredictionScore(userIds, points, [
      { userId: 'ana', outcome: '1' },
      { userId: 'boris', outcome: 'X' },
      { userId: 'cora', outcome: '2' },
    ], outcome)

    closeEnough(points.ana, 0)
    closeEnough(points.boris, 0)
    closeEnough(points.cora, 0)
    closeEnough(points.darko, 0)
    printPoints('no X1 predictor: no one scores, non-voters stay unchanged', points)
  }

  console.log('OK: knockout draws score X1/X2 from qualifier, not plain X/1/2.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
