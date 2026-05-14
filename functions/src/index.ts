import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { Resend } from 'resend'
import { fifaMemberAssociations } from './fifaMemberAssociations'
import { calculateSyncPeriod, syncLiveFixtures, syncMlsFixtureCatalog } from './sync'
import { refreshWinningChances } from './winningChances'

admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const apiFootballKey = defineSecret('API_FOOTBALL_KEY')
const appUrl = defineString('APP_URL')
const resendFrom = defineString('RESEND_FROM')
const adminEmails = defineString('ADMIN_EMAILS', {
  default: 'darko.cengija.dc@gmail.com',
})

const FUNCTIONS_REGION = 'us-central1'
const DRAW_STATE_PATH = 'draw/state'
const RANKING_SNAPSHOT = 'FIFA/Coca-Cola Men’s World Ranking, 1 April 2026'
const VALID_CONFEDERATIONS = new Set(['AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA'])
const MAX_DISPLAY_NAME_LENGTH = 80
const MAX_EMAIL_LENGTH = 254
const MAX_AVATAR_URL_LENGTH = 2000
const MAX_ALIAS_LENGTH = 80
const MAX_FLAG_LENGTH = 16

interface TeamRow {
  id: string
  name?: string
  flag?: string
  confederation?: string
  fifaRank?: number
  drawSeedOrder?: number
}

interface PlayerSnapshot {
  uid: string
  displayName: string
  avatarUrl: string | null
}

interface DrawAssignment {
  userId: string
  teamId: string
  round: number
  pick: number
  assignedAt?: admin.firestore.Timestamp
}

interface DrawState {
  status: 'round_intro' | 'picking' | 'round_summary' | 'completed'
  roundNumber: number
  roundCount: number
  teamsPerPlayer: number
  numberOfTeams: number
  numberOfPlayers: number
  doubleOwnedLimit: number
  players: PlayerSnapshot[]
  teamIds: string[]
  currentRoundOrder: string[]
  currentPlayerIndex: number | null
  currentPlayerId: string | null
  currentSelectionTeamId: string | null
  assignments: DrawAssignment[]
}

async function requireAdmin(uid: string | undefined): Promise<void> {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in is required.')

  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  if (userSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access is required.')
  }
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null
  return email
}

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) return null
  return trimmed
}

function cleanAvatarUrl(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return cleanString(value, MAX_AVATAR_URL_LENGTH)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function findInviteByEmail(email: string): Promise<admin.firestore.QueryDocumentSnapshot | null> {
  const snap = await admin.firestore()
    .collection('allowedUsers')
    .where('email', '==', email)
    .limit(1)
    .get()
  return snap.docs[0] ?? null
}

function isBootstrapAdminEmail(email: string): boolean {
  return adminEmails.value()
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email)
}

async function requireInvitedAuth(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in is required.')

  const rawEmail = request.auth?.token?.email
  const emailVerified = request.auth?.token?.email_verified
  const email = normalizeEmail(rawEmail)
  if (!email || emailVerified !== true) {
    console.warn('[requireInvitedAuth] rejected: missing or unverified email', { uid, rawEmail, emailVerified })
    throw new HttpsError('permission-denied', 'A verified invited email address is required.')
  }

  const invite = await findInviteByEmail(email)
  if (!invite && !isBootstrapAdminEmail(email)) {
    console.warn('[requireInvitedAuth] rejected: not on invite list', { uid, email })
    throw new HttpsError('permission-denied', 'Your account is not on the invite list.')
  }

  return { uid, email, invite }
}

function normalizeTeamName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function cleanOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function backfillUserAvatarsFromAuth() {
  const db = admin.firestore()
  let pageToken: string | undefined
  let checked = 0
  let usersWithGooglePhoto = 0
  let updated = 0
  let skippedExistingAvatar = 0
  let missingProfile = 0

  do {
    const page = await admin.auth().listUsers(1000, pageToken)
    checked += page.users.length

    const usersWithPhoto = page.users
      .map((authUser) => ({
        uid: authUser.uid,
        photoURL: cleanAvatarUrl(authUser.photoURL),
      }))
      .filter((authUser): authUser is { uid: string; photoURL: string } => authUser.photoURL !== null)

    usersWithGooglePhoto += usersWithPhoto.length

    if (usersWithPhoto.length > 0) {
      const refs = usersWithPhoto.map((authUser) => db.doc(`users/${authUser.uid}`))
      const snaps = await db.getAll(...refs)
      let batch = db.batch()
      let batchCount = 0

      async function commitIfNeeded(force = false) {
        if (batchCount === 0 || (!force && batchCount < 400)) return
        await batch.commit()
        batch = db.batch()
        batchCount = 0
      }

      for (let index = 0; index < usersWithPhoto.length; index += 1) {
        const authUser = usersWithPhoto[index]
        const userSnap = snaps[index]
        if (!userSnap.exists) {
          missingProfile += 1
          continue
        }

        const existingAvatar = userSnap.data()?.avatarUrl
        if (typeof existingAvatar === 'string' && existingAvatar.trim()) {
          skippedExistingAvatar += 1
          continue
        }

        batch.set(userSnap.ref, {
          avatarUrl: authUser.photoURL,
          avatarBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true })
        updated += 1
        batchCount += 1
        await commitIfNeeded()
      }

      await commitIfNeeded(true)
    }

    pageToken = page.pageToken
  } while (pageToken)

  return {
    checked,
    usersWithGooglePhoto,
    updated,
    skippedExistingAvatar,
    missingProfile,
  }
}

export const syncCurrentUser = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const { uid, email, invite } = await requireInvitedAuth(request)
  const data = request.data as { displayName?: unknown; photoURL?: unknown } | undefined

  const db = admin.firestore()
  const userRef = db.doc(`users/${uid}`)
  const userSnap = await userRef.get()
  const existing = userSnap.data()
  const inviteName = invite ? cleanString(invite.data().name, MAX_DISPLAY_NAME_LENGTH) : null
  const authName = cleanString(data?.displayName, MAX_DISPLAY_NAME_LENGTH)
  const photoURL = cleanAvatarUrl(data?.photoURL)
  const role = existing?.role === 'admin' || isBootstrapAdminEmail(email) ? 'admin' : 'player'
  const existingAvatarUrl = existing?.avatarUrl

  const user = {
    uid,
    email,
    displayName: cleanString(existing?.displayName, MAX_DISPLAY_NAME_LENGTH)
      ?? inviteName
      ?? authName
      ?? email.split('@')[0],
    avatarUrl: typeof existingAvatarUrl === 'string' && existingAvatarUrl.trim()
      ? existingAvatarUrl
      : photoURL,
    role,
    onboardingComplete: existing?.onboardingComplete === true,
  }

  await userRef.set({
    ...user,
    lastSignedInAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(userSnap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
  }, { merge: true })

  return user
})

export const backfillUserAvatarsNow = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)
    return { success: true, ...await backfillUserAvatarsFromAuth() }
  },
)

export const updateCurrentUserProfile = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const { uid, email } = await requireInvitedAuth(request)
  const data = request.data as { displayName?: unknown; avatarUrl?: unknown } | undefined
  const displayName = cleanString(data?.displayName, MAX_DISPLAY_NAME_LENGTH)
  if (!displayName) throw new HttpsError('invalid-argument', 'A display name is required.')

  const avatarUrl = cleanAvatarUrl(data?.avatarUrl)
  const db = admin.firestore()
  const userRef = db.doc(`users/${uid}`)
  const userSnap = await userRef.get()
  const existing = userSnap.data()
  const role = existing?.role === 'admin' || isBootstrapAdminEmail(email) ? 'admin' : 'player'
  const user = {
    uid,
    email,
    displayName,
    avatarUrl,
    role,
    onboardingComplete: true,
  }

  await userRef.set({
    ...user,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSignedInAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(userSnap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
  }, { merge: true })

  await admin.auth().updateUser(uid, { displayName }).catch((err) => {
    console.error('Failed to mirror profile displayName to Firebase Auth.', err)
  })

  return user
})

async function touchMatchesForTeam(teamId: string): Promise<number> {
  const db = admin.firestore()
  const [homeSnap, awaySnap] = await Promise.all([
    db.collection('matches').where('homeTeamId', '==', teamId).get(),
    db.collection('matches').where('awayTeamId', '==', teamId).get(),
  ])
  const refs = new Map<string, admin.firestore.DocumentReference>()
  for (const docSnap of [...homeSnap.docs, ...awaySnap.docs]) refs.set(docSnap.ref.path, docSnap.ref)
  if (refs.size === 0) return 0

  const batch = db.batch()
  for (const ref of refs.values()) {
    batch.set(ref, { teamMetadataUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
  }
  await batch.commit()
  return refs.size
}

async function loadDrawContext(): Promise<{ teams: TeamRow[]; players: PlayerSnapshot[] }> {
  const db = admin.firestore()
  const [teamsSnap, usersSnap] = await Promise.all([
    db.collection('teams').where('drawEligible', '==', true).get(),
    db.collection('users').where('onboardingComplete', '==', true).get(),
  ])

  const teams = teamsSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as TeamRow))
    .sort((a, b) => (a.drawSeedOrder ?? 999) - (b.drawSeedOrder ?? 999))

  const players = usersSnap.docs
    .map((docSnap) => {
      const data = docSnap.data()
      return {
        uid: docSnap.id,
        displayName: (data.displayName as string | undefined) ?? '',
        avatarUrl: (data.avatarUrl as string | null | undefined) ?? null,
      }
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName))

  if (teams.length === 0) throw new HttpsError('failed-precondition', 'No draw-eligible teams found.')
  if (players.length === 0) throw new HttpsError('failed-precondition', 'No accepted players found.')

  return { teams, players }
}

function computeTeamsPerPlayerLimits(numberOfTeams: number, numberOfPlayers: number) {
  const min = Math.ceil(numberOfTeams / numberOfPlayers)
  const max = Math.floor((numberOfTeams * 2) / numberOfPlayers)
  return { min, max }
}

function normalizeOrder(savedIds: unknown, teams: TeamRow[]): string[] {
  const allIds = teams.map((team) => team.id)
  const validIds = new Set(allIds)
  const saved = Array.isArray(savedIds)
    ? savedIds.filter((id): id is string => typeof id === 'string' && validIds.has(id))
    : []
  const missing = allIds.filter((id) => !saved.includes(id))
  return [...saved, ...missing]
}

async function ensureTeamLists(
  players: PlayerSnapshot[],
  teams: TeamRow[],
  resetToDefault = false,
  ready = true,
  rankingSnapshot = RANKING_SNAPSHOT,
): Promise<void> {
  const db = admin.firestore()
  const batch = db.batch()

  for (const player of players) {
    const listRef = db.doc(`teamLists/${player.uid}`)
    const statusRef = db.doc(`teamListStatuses/${player.uid}`)
    const listSnap = await listRef.get()
    const teamIds = resetToDefault
      ? teams.map((team) => team.id)
      : normalizeOrder(listSnap.data()?.teamIds, teams)

    batch.set(listRef, {
      userId: player.uid,
      teamIds,
      teamCount: teamIds.length,
      rankingSnapshot,
      ...(listSnap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    batch.set(statusRef, {
      userId: player.uid,
      ready: ready && teamIds.length === teams.length,
      teamCount: teamIds.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
  }

  await batch.commit()
}

async function getDrawRankingSnapshot(): Promise<string> {
  const snap = await admin.firestore().doc('config/app').get()
  const value = snap.data()?.drawRankingSnapshot
  return typeof value === 'string' && value.trim() ? value.trim() : RANKING_SNAPSHOT
}

async function refreshWinningChancesForActiveCompetition(apiKey: string | null) {
  const db = admin.firestore()
  const configSnap = await db.doc('config/app').get()
  const competitionMode = configSnap.data()?.competitionMode

  if (typeof competitionMode === 'string' && competitionMode !== 'world_cup_2026') {
    await db.doc('stats/winningChances').set({
      rows: [],
      simulationCount: 0,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      model: `disabled-for-${competitionMode}`,
      oddsStatus: 'skipped_non_world_cup',
      oddsFixtureCount: 0,
      oddsBackedMatches: 0,
      apiRequestsUsed: 0,
    })

    return {
      rows: [],
      apiRequestsUsed: 0,
      oddsStatus: 'skipped_non_world_cup',
      oddsFixtureCount: 0,
      oddsBackedMatches: 0,
    }
  }

  return await refreshWinningChances(apiKey)
}

async function readTeamList(userId: string, teams: TeamRow[]): Promise<string[]> {
  const snap = await admin.firestore().doc(`teamLists/${userId}`).get()
  return normalizeOrder(snap.data()?.teamIds, teams)
}

async function readDrawState(): Promise<DrawState> {
  const snap = await admin.firestore().doc(DRAW_STATE_PATH).get()
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Draw has not been started.')
  return snap.data() as DrawState
}

function shuffle(ids: string[]): string[] {
  const result = [...ids]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

function getAvailability(assignments: DrawAssignment[], userId: string, doubleOwnedLimit: number) {
  const ownerCounts: Record<string, number> = {}
  const playerTeamIds = new Set<string>()

  for (const assignment of assignments) {
    ownerCounts[assignment.teamId] = (ownerCounts[assignment.teamId] ?? 0) + 1
    if (assignment.userId === userId) playerTeamIds.add(assignment.teamId)
  }

  const doubleOwnedCount = Object.values(ownerCounts).filter((count) => count >= 2).length

  return (teamId: string) => {
    if (playerTeamIds.has(teamId)) return false

    const ownerCount = ownerCounts[teamId] ?? 0
    if (ownerCount === 0) return true
    if (ownerCount >= 2) return false
    return doubleOwnedCount < doubleOwnedLimit
  }
}

function getPreferredAvailableTeamId(
  teamIds: string[],
  assignments: DrawAssignment[],
  userId: string,
  doubleOwnedLimit: number,
): string {
  const isAvailable = getAvailability(assignments, userId, doubleOwnedLimit)
  const teamId = teamIds.find((id) => isAvailable(id))
  if (!teamId) throw new HttpsError('failed-precondition', 'No available team found for this player.')
  return teamId
}

async function deleteCollection(collectionPath: string): Promise<void> {
  const db = admin.firestore()
  const pageSize = 400
  let snap = await db.collection(collectionPath).limit(pageSize).get()

  while (!snap.empty) {
    const batch = db.batch()
    for (const docSnap of snap.docs) batch.delete(docSnap.ref)
    await batch.commit()
    snap = await db.collection(collectionPath).limit(pageSize).get()
  }
}

export const sendInviteEmail = onCall(
  {
    region: FUNCTIONS_REGION,
    secrets: [resendApiKey],
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)

    const data = request.data as { email?: unknown; name?: unknown } | undefined
    const email = normalizeEmail(data?.email)
    const name = cleanString(data?.name, MAX_DISPLAY_NAME_LENGTH)
    if (!email) throw new HttpsError('invalid-argument', 'A valid email is required.')

    const db = admin.firestore()
    const inviteRef = db.doc(`allowedUsers/${email}`)
    const inviteLogRef = db.doc(`inviteLogs/${email}`)

    await inviteRef.set({
      email,
      name: name ?? '',
      lastInvitedAt: admin.firestore.FieldValue.serverTimestamp(),
      invitedByUid: request.auth?.uid ?? null,
    }, { merge: true })

    const greeting = name ? `Hey ${escapeHtml(name)},` : 'Hey,'
    const resend = new Resend(resendApiKey.value())
    const from = resendFrom.value()
    const url = appUrl.value()
    if (!from || !url) {
      throw new HttpsError('failed-precondition', 'APP_URL and RESEND_FROM must be configured before sending invites.')
    }

    const result = await resend.emails.send({
      from,
      to: email,
      subject: 'You are invited to World Cup 26',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
          <h2 style="margin-top:0;color:#facc15;">World Cup 26</h2>
          <p>${greeting}</p>
          <p>You are invited to the private World Cup 26 app. Sign in with this email address to join.</p>
          <a href="${url}?install=1" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#facc15;color:#0f172a;border-radius:8px;font-weight:700;text-decoration:none;">
            Open the app
          </a>
          <p style="margin-top:32px;font-size:12px;color:#64748b;">If you were not expecting this email, you can ignore it.</p>
        </div>
      `,
    })

    if (result.error) {
      await inviteLogRef.set({
        email,
        lastStatus: 'error',
        lastError: result.error.message,
        lastStatusAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: admin.firestore.FieldValue.increment(1),
      }, { merge: true })
      throw new HttpsError('internal', result.error.message)
    }

    const messageId = result.data?.id ?? null
    await inviteLogRef.set({
      email,
      messageId,
      lastStatus: 'sent',
      lastError: null,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      lastStatusAt: admin.firestore.FieldValue.serverTimestamp(),
      attempts: admin.firestore.FieldValue.increment(1),
    }, { merge: true })

    return { success: true, messageId }
  },
)

export const startTeamsDraw = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  await requireAdmin(request.auth?.uid)

  const db = admin.firestore()
  const { teams, players } = await loadDrawContext()
  const rankingSnapshot = await getDrawRankingSnapshot()
  const { min, max } = computeTeamsPerPlayerLimits(teams.length, players.length)
  if (min > max) {
    throw new HttpsError(
      'failed-precondition',
      `Draw is impossible with ${players.length} players and ${teams.length} teams.`,
    )
  }

  const requested = (request.data as { teamsPerPlayer?: unknown } | undefined)?.teamsPerPlayer
  const teamsPerPlayer = typeof requested === 'number' && Number.isInteger(requested)
    ? requested
    : min

  if (teamsPerPlayer < min || teamsPerPlayer > max) {
    throw new HttpsError(
      'invalid-argument',
      `teamsPerPlayer must be between ${min} and ${max}.`,
    )
  }

  await ensureTeamLists(players, teams, false, true, rankingSnapshot)
  await deleteCollection('playerTeams')

  const state: DrawState = {
    status: 'round_intro',
    roundNumber: 1,
    roundCount: teamsPerPlayer,
    teamsPerPlayer,
    numberOfTeams: teams.length,
    numberOfPlayers: players.length,
    doubleOwnedLimit: teamsPerPlayer * players.length - teams.length,
    players,
    teamIds: teams.map((team) => team.id),
    currentRoundOrder: [],
    currentPlayerIndex: null,
    currentPlayerId: null,
    currentSelectionTeamId: null,
    assignments: [],
  }

  const batch = db.batch()
  batch.set(db.doc(DRAW_STATE_PATH), {
    ...state,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  batch.set(db.doc('config/app'), {
    drawStatus: 'draw_day',
    teamsPerPlayer,
    gameStartedAt: null,
    drawStartedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  await batch.commit()

  return { success: true }
})

export const startTeamsDrawRound = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  await requireAdmin(request.auth?.uid)

  const db = admin.firestore()
  const { teams } = await loadDrawContext()
  const state = await readDrawState()

  if (state.status !== 'round_intro' && state.status !== 'round_summary') {
    throw new HttpsError('failed-precondition', 'A round cannot be started right now.')
  }

  const roundNumber = state.status === 'round_summary' ? state.roundNumber + 1 : state.roundNumber
  if (roundNumber > state.roundCount) {
    throw new HttpsError('failed-precondition', 'All rounds are already complete.')
  }

  const currentRoundOrder = shuffle(state.players.map((player) => player.uid))
  const currentPlayerId = currentRoundOrder[0]
  const teamList = await readTeamList(currentPlayerId, teams)
  const currentSelectionTeamId = getPreferredAvailableTeamId(
    teamList,
    state.assignments,
    currentPlayerId,
    state.doubleOwnedLimit,
  )

  await db.doc(DRAW_STATE_PATH).set({
    ...state,
    status: 'picking',
    roundNumber,
    currentRoundOrder,
    currentPlayerIndex: 0,
    currentPlayerId,
    currentSelectionTeamId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { success: true }
})

export const selectTeamsDrawTeam = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  await requireAdmin(request.auth?.uid)

  const teamId = (request.data as { teamId?: unknown } | undefined)?.teamId
  if (typeof teamId !== 'string') throw new HttpsError('invalid-argument', 'teamId is required.')

  const state = await readDrawState()
  if (state.status !== 'picking' || !state.currentPlayerId) {
    throw new HttpsError('failed-precondition', 'No active pick is available.')
  }
  if (!state.teamIds.includes(teamId)) {
    throw new HttpsError('invalid-argument', 'Unknown team.')
  }

  const isAvailable = getAvailability(
    state.assignments,
    state.currentPlayerId,
    state.doubleOwnedLimit,
  )
  if (!isAvailable(teamId)) {
    throw new HttpsError('failed-precondition', 'That team is no longer available.')
  }

  await admin.firestore().doc(DRAW_STATE_PATH).set({
    currentSelectionTeamId: teamId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  return { success: true }
})

export const advanceTeamsDraw = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  await requireAdmin(request.auth?.uid)

  const db = admin.firestore()
  const { teams } = await loadDrawContext()
  const state = await readDrawState()

  if (
    state.status !== 'picking'
    || state.currentPlayerIndex === null
    || !state.currentPlayerId
    || !state.currentSelectionTeamId
  ) {
    throw new HttpsError('failed-precondition', 'No active pick is available.')
  }

  const isAvailable = getAvailability(
    state.assignments,
    state.currentPlayerId,
    state.doubleOwnedLimit,
  )
  if (!isAvailable(state.currentSelectionTeamId)) {
    throw new HttpsError('failed-precondition', 'Selected team is no longer available.')
  }

  const assignedAt = admin.firestore.Timestamp.now()
  const assignment: DrawAssignment = {
    userId: state.currentPlayerId,
    teamId: state.currentSelectionTeamId,
    round: state.roundNumber,
    pick: state.assignments.length + 1,
    assignedAt,
  }
  const assignments = [...state.assignments, assignment]
  const isLastPlayer = state.currentPlayerIndex >= state.currentRoundOrder.length - 1

  const batch = db.batch()
  batch.set(db.doc(`playerTeams/${assignment.userId}_${assignment.teamId}`), {
    userId: assignment.userId,
    teamId: assignment.teamId,
    round: assignment.round,
    pick: assignment.pick,
    assignedAt,
  }, { merge: true })

  if (isLastPlayer) {
    batch.set(db.doc(DRAW_STATE_PATH), {
      ...state,
      status: 'round_summary',
      currentPlayerIndex: null,
      currentPlayerId: null,
      currentSelectionTeamId: null,
      assignments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  } else {
    const nextPlayerIndex = state.currentPlayerIndex + 1
    const nextPlayerId = state.currentRoundOrder[nextPlayerIndex]
    const nextTeamList = await readTeamList(nextPlayerId, teams)
    const nextSelectionTeamId = getPreferredAvailableTeamId(
      nextTeamList,
      assignments,
      nextPlayerId,
      state.doubleOwnedLimit,
    )

    batch.set(db.doc(DRAW_STATE_PATH), {
      ...state,
      currentPlayerIndex: nextPlayerIndex,
      currentPlayerId: nextPlayerId,
      currentSelectionTeamId: nextSelectionTeamId,
      assignments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
  return { success: true }
})

export const completeTeamsDraw = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [apiFootballKey],
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)

    const db = admin.firestore()
    const state = await readDrawState()
    if (state.status !== 'round_summary' || state.roundNumber !== state.roundCount) {
      throw new HttpsError('failed-precondition', 'The draw is not complete yet.')
    }

    const expectedAssignments = state.roundCount * state.numberOfPlayers
    if (state.assignments.length !== expectedAssignments) {
      throw new HttpsError('failed-precondition', 'The draw assignment count is incomplete.')
    }

    const now = admin.firestore.Timestamp.now()
    const batch = db.batch()
    batch.set(db.doc(DRAW_STATE_PATH), {
      ...state,
      status: 'completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    batch.set(db.doc('config/app'), {
      drawStatus: 'completed',
      gameStartedAt: now,
    }, { merge: true })
    await batch.commit()

    await refreshWinningChancesForActiveCompetition(apiFootballKey.value() || null)

    return { success: true }
  },
)

export const replaceWorldCupTeam = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [apiFootballKey],
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)

    const data = request.data as {
      droppedTeamId?: unknown
      replacement?: {
        id?: unknown
        fifaRank?: unknown
      }
    } | undefined

    const droppedTeamId = cleanOptionalString(data?.droppedTeamId)
    const replacementId = cleanOptionalString(data?.replacement?.id)
    const replacementSource = fifaMemberAssociations.find((team) => team.id === replacementId)
    const replacementName = replacementSource?.name ?? null
    const replacementFlag = replacementSource?.flag ?? null
    const replacementConfederation = replacementSource?.confederation ?? null
    const replacementRank = typeof data?.replacement?.fifaRank === 'number'
      && Number.isInteger(data.replacement.fifaRank)
      && data.replacement.fifaRank >= 1
      && data.replacement.fifaRank <= 250
      ? data.replacement.fifaRank
      : null
    const apiFootballAliases = Array.from(new Set(
      (replacementSource?.apiFootballAliases ?? [])
        .map((alias) => cleanString(alias, MAX_ALIAS_LENGTH))
        .filter((alias): alias is string => alias !== null),
    ))

    if (!droppedTeamId || !replacementId || !replacementName || !replacementFlag || !replacementConfederation) {
      throw new HttpsError('invalid-argument', 'Dropped team and replacement team are required.')
    }
    if (replacementFlag.length > MAX_FLAG_LENGTH || !VALID_CONFEDERATIONS.has(replacementConfederation)) {
      throw new HttpsError('invalid-argument', 'Replacement team metadata is invalid.')
    }

    const db = admin.firestore()
    const droppedRef = db.doc(`teams/${droppedTeamId}`)
    const [droppedSnap, activeTeamsSnap] = await Promise.all([
      droppedRef.get(),
      db.collection('teams').where('drawEligible', '==', true).get(),
    ])
    if (!droppedSnap.exists) throw new HttpsError('not-found', 'Dropped team was not found.')

    const droppedTeam = { id: droppedSnap.id, ...droppedSnap.data() } as TeamRow
    if (droppedTeam.drawSeedOrder === undefined) {
      throw new HttpsError('failed-precondition', 'Only World Cup draw teams can be replaced.')
    }

    const activeNames = new Set(
      activeTeamsSnap.docs.map((docSnap) =>
        normalizeTeamName((docSnap.data().name as string | undefined) ?? docSnap.id),
      ),
    )
    if (activeTeamsSnap.docs.some((docSnap) => docSnap.id === replacementId)) {
      throw new HttpsError('failed-precondition', 'Replacement team is already in the active tournament field.')
    }
    if (activeNames.has(normalizeTeamName(replacementName))) {
      throw new HttpsError('failed-precondition', 'Replacement team is already in the active tournament field.')
    }
    for (const alias of apiFootballAliases) {
      if (activeNames.has(normalizeTeamName(alias))) {
        throw new HttpsError('failed-precondition', 'Replacement team alias is already in the active tournament field.')
      }
    }

    const now = admin.firestore.Timestamp.now()
    const replacement = {
      active: true,
      replacedTeamId: droppedTeam.id,
      replacedTeamName: droppedTeam.name ?? droppedTeam.id,
      replacedTeamFlag: droppedTeam.flag ?? '',
      replacementAssociationId: replacementId,
      replacementName,
      replacementFlag,
      replacedAt: now,
      replacedByUid: request.auth?.uid ?? null,
    }

    const historyRef = db.collection('teamReplacementHistory').doc()
    const batch = db.batch()
    batch.set(droppedRef, {
      name: replacementName,
      flag: replacementFlag,
      confederation: replacementConfederation,
      fifaRank: replacementRank ?? admin.firestore.FieldValue.delete(),
      apiFootballAliases: [replacementName, ...apiFootballAliases],
      replacement,
      replacementUpdatedAt: now,
      replacementUpdatedByUid: request.auth?.uid ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    batch.set(historyRef, {
      teamId: droppedTeam.id,
      previousName: droppedTeam.name ?? droppedTeam.id,
      previousFlag: droppedTeam.flag ?? '',
      previousConfederation: droppedTeam.confederation ?? null,
      previousFifaRank: droppedTeam.fifaRank ?? null,
      replacementAssociationId: replacementId,
      replacementName,
      replacementFlag,
      replacementConfederation,
      replacementFifaRank: replacementRank,
      apiFootballAliases,
      replacedAt: now,
      replacedByUid: request.auth?.uid ?? null,
    })
    batch.set(db.doc('config/app'), {
      teamReplacementUpdatedAt: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
    await batch.commit()

    const warnings: string[] = []
    let touchedMatches = 0
    let winningChances: unknown = null

    try {
      touchedMatches = await touchMatchesForTeam(droppedTeam.id)
    } catch (error) {
      console.error('replaceWorldCupTeam: failed to touch matches', error)
      warnings.push('Team was replaced, but affected matches may need a refresh.')
    }

    try {
      winningChances = await refreshWinningChancesForActiveCompetition(apiFootballKey.value() || null)
    } catch (error) {
      console.error('replaceWorldCupTeam: failed to refresh winning chances', error)
      warnings.push('Team was replaced, but winning chances could not be refreshed automatically.')
    }

    return {
      success: true,
      teamId: droppedTeam.id,
      replacementName,
      touchedMatches,
      winningChances,
      warnings,
    }
  },
)

export const resetTeamsDrawForTesting = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  await requireAdmin(request.auth?.uid)

  const db = admin.firestore()
  const { teams, players } = await loadDrawContext()
  const rankingSnapshot = await getDrawRankingSnapshot()

  await Promise.all([
    deleteCollection('playerTeams'),
    deleteCollection('predictions'),
  ])
  await ensureTeamLists(players, teams, true, false, rankingSnapshot)

  const batch = db.batch()
  batch.delete(db.doc(DRAW_STATE_PATH))
  batch.set(db.doc('config/app'), {
    drawStatus: 'list_building',
    gameStartedAt: null,
    teamsPerPlayer: Math.ceil(teams.length / players.length),
    drawResetAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  await batch.commit()

  return { success: true }
})

/**
 * Sends a push notification to all users (except the author) when a new chat message is created.
 * Uses data-only FCM messages so the service worker handles display + badge update.
 */
export const onNewChatMessage = onDocumentCreated(
  {
    document: 'messages/{messageId}',
    region: FUNCTIONS_REGION,
  },
  async (event) => {
  const msg = event.data?.data()
  if (!msg) return

  const { authorId, text, authorName, mentions = [] } = msg as {
    authorId: string
    text: string
    authorName: string
    mentions: string[]
  }

  const db = admin.firestore()
  const tokensSnap = await db.collection('pushTokens').get()
  if (tokensSnap.empty) return

  // Read chatReads and recent messages in parallel to compute per-user unread counts
  const [chatReadsSnap, recentMessagesSnap] = await Promise.all([
    db.collection('chatReads').get(),
    db.collection('messages').orderBy('timestamp', 'desc').limit(200).get(),
  ])

  const lastReadMap: Record<string, Date> = {}
  for (const doc of chatReadsSnap.docs) {
    const ts = doc.data().lastReadAt as admin.firestore.Timestamp | null
    lastReadMap[doc.id] = ts ? ts.toDate() : new Date(0)
  }

  const recentMessages = recentMessagesSnap.docs.map((d) => ({
    authorId: d.data().authorId as string,
    timestamp: (d.data().timestamp as admin.firestore.Timestamp).toDate(),
  }))

  function unreadCountFor(userId: string): number {
    const lastRead = lastReadMap[userId] ?? new Date(0)
    const count = recentMessages.filter((m) => m.authorId !== userId && m.timestamp > lastRead).length
    console.log(`[unread] userId=${userId} lastRead=${lastRead.toISOString()} count=${count}`)
    return count
  }

  const messaging = admin.messaging()
  const truncated = text.length > 80 ? text.slice(0, 80) + '…' : text

  const userSends: Array<{ userId: string; tokens: string[] }> = []
  for (const tokenDoc of tokensSnap.docs) {
    const userId = tokenDoc.id
    if (userId === authorId) continue
    const tokens = Object.keys(tokenDoc.data()).filter((k) => k !== 'updatedAt')
    if (tokens.length > 0) userSends.push({ userId, tokens })
  }

  if (userSends.length === 0) return

  await Promise.all(
    userSends.map(async ({ userId, tokens }) => {
      const isMentioned = (mentions as string[]).includes(userId)
      const unreadCount = unreadCountFor(userId)
      const result = await messaging.sendEachForMulticast({
        tokens,
        data: {
          type: 'chat',
          title: isMentioned ? `💬 ${authorName} mentioned you` : `💬 ${authorName}`,
          body: truncated,
          url: '/chat',
          unreadCount: String(unreadCount),
        },
        webpush: { headers: { Urgency: 'high' } },
      })

      // Remove stale tokens
      const stale = result.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter((t): t is string => t !== null)
      if (stale.length > 0) {
        const updates: Record<string, admin.firestore.FieldValue> = {}
        stale.forEach((t) => (updates[t] = admin.firestore.FieldValue.delete()))
        await db.doc(`pushTokens/${userId}`).update(updates)
      }
    }),
  )
  },
)

/**
 * Sends push reminders to players who haven't predicted a match starting in ~4h.
 * Runs every hour.
 */
export const sendMatchReminders = onSchedule(
  {
    region: FUNCTIONS_REGION,
    schedule: 'every 60 minutes',
    timeoutSeconds: 120,
  },
  async () => {
    const db = admin.firestore()
    const now = new Date()
    const windowStart = new Date(now.getTime() + 3.5 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 4.5 * 60 * 60 * 1000)

    const matchesSnap = await db
      .collection('matches')
      .where('status', '==', 'upcoming')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(windowStart))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(windowEnd))
      .get()

    if (matchesSnap.empty) return

    const tokensSnap = await db.collection('pushTokens').get()
    if (tokensSnap.empty) return

    const messaging = admin.messaging()

    for (const matchDoc of matchesSnap.docs) {
      const matchId = matchDoc.id
      const matchDate = (matchDoc.data().date as admin.firestore.Timestamp).toDate()
      console.log(`[reminder] matchId=${matchId} storedISO=${matchDate.toISOString()}`)

      // Find users who already have a prediction for this match
      const predsSnap = await db.collection('predictions').where('matchId', '==', matchId).get()
      const predictedUserIds = new Set(predsSnap.docs.map((d) => d.data().userId as string))

      // Send to users without a prediction
      for (const tokenDoc of tokensSnap.docs) {
        const userId = tokenDoc.id
        if (predictedUserIds.has(userId)) continue

        const tokens = Object.keys(tokenDoc.data()).filter((k) => k !== 'updatedAt')
        if (tokens.length === 0) continue

        await messaging.sendEachForMulticast({
          tokens,
          data: {
            type: 'reminder',
            title: '⏰ Prediction reminder',
            body: 'Match starts in about 4 hours. Send your prediction.',
            matchId,
            url: `/match/${matchId}`,
          },
          webpush: { headers: { Urgency: 'high' } },
        })
      }
    }
  },
)

export const refreshWinningChancesDaily = onSchedule(
  {
    region: FUNCTIONS_REGION,
    schedule: '0 8 * * *',
    timeZone: 'Etc/UTC',
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [apiFootballKey],
  },
  async () => {
    await refreshWinningChancesForActiveCompetition(apiFootballKey.value() || null)
  },
)

export const refreshWinningChancesNow = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [apiFootballKey],
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)
    const result = await refreshWinningChancesForActiveCompetition(apiFootballKey.value() || null)
    return {
      success: true,
      apiRequestsUsed: result.apiRequestsUsed,
      oddsStatus: result.oddsStatus,
      oddsFixtureCount: result.oddsFixtureCount,
      oddsBackedMatches: result.oddsBackedMatches,
      rows: result.rows.length,
    }
  },
)

export const refreshMlsFixturesDaily = onSchedule(
  {
    region: FUNCTIONS_REGION,
    schedule: '15 8 * * *',
    timeZone: 'Etc/UTC',
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [apiFootballKey],
  },
  async () => {
    await syncMlsFixtureCatalog(apiFootballKey.value() || null)
  },
)

export const calculateLiveSyncPeriodDaily = onSchedule(
  {
    region: FUNCTIONS_REGION,
    schedule: '0 10 * * *',
    timeZone: 'Etc/UTC',
    timeoutSeconds: 120,
  },
  async () => {
    await calculateSyncPeriod()
  },
)

export const syncLiveMatches = onSchedule(
  {
    region: FUNCTIONS_REGION,
    schedule: 'every 1 minutes',
    timeoutSeconds: 120,
    secrets: [apiFootballKey],
  },
  async () => {
    await syncLiveFixtures(apiFootballKey.value() || null)
  },
)

export const refreshMlsFixturesNow = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [apiFootballKey],
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)
    const result = await syncMlsFixtureCatalog(apiFootballKey.value() || null)
    return { success: true, ...result }
  },
)

export const calculateLiveSyncPeriodNow = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)
    const result = await calculateSyncPeriod()
    return { success: true, ...result }
  },
)

export const syncLiveMatchesNow = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
    secrets: [apiFootballKey],
  },
  async (request) => {
    await requireAdmin(request.auth?.uid)
    const result = await syncLiveFixtures(apiFootballKey.value() || null)
    return { success: true, ...result }
  },
)
