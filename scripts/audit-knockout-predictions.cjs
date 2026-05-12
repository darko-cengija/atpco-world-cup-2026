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

async function main() {
  const helperUrl = pathToFileURL(path.resolve(__dirname, '../src/lib/predictions.ts')).href
  const { actualOutcome, applyPredictionScore } = await import(helperUrl)
  const userIds = ['ana', 'boris', 'cora', 'darko']

  console.log('Knockout prediction audit')

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
    closeEnough(points.darko, -0.25)
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
    closeEnough(points.darko, -0.25)
    printPoints('no X1 predictor: no one scores, non-voter penalty still applies', points)
  }

  console.log('OK: knockout draws score X1/X2 from qualifier, not plain X/1/2.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
