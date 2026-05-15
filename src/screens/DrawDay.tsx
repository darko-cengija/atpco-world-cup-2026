import { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { CheckCircle2, ChevronDown, Circle, Play, Settings, Shuffle, Users } from 'lucide-react'
import { db, functions } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useDrawConfig } from '@/hooks/useDrawConfig'
import { getCountryName } from '@/lib/translations'
import type { AppUser, DrawAssignment, DrawState, Team } from '@/types'
import { TicketSpinner } from '@/components/TicketMark'

const PICKER_ROW_HEIGHT = 44
const PICKER_VISIBLE_ROWS = 5
const ROUND_LABELS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
]

interface PlayerStatus {
  user: AppUser
  ready: boolean
}

function getRoundLabel(round: number) {
  return ROUND_LABELS[round - 1] ? `${ROUND_LABELS[round - 1]} Round` : `Round ${round}`
}

function getAssignmentsByUser(assignments: DrawAssignment[]) {
  const result: Record<string, DrawAssignment[]> = {}
  for (const assignment of assignments) {
    result[assignment.userId] = [...(result[assignment.userId] ?? []), assignment]
  }
  for (const userId of Object.keys(result)) {
    result[userId].sort((a, b) => a.round - b.round || a.pick - b.pick)
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export default function DrawDay() {
  const { user } = useAuth()
  const { config } = useDrawConfig()
  const isAdmin = user?.role === 'admin'

  const [players, setPlayers] = useState<PlayerStatus[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [drawState, setDrawState] = useState<DrawState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamsPerPlayer, setSelectedTeamsPerPlayer] = useState(4)
  const [savedTeamsPerPlayer, setSavedTeamsPerPlayer] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [showPerOwnerPicker, setShowPerOwnerPicker] = useState(false)
  const [showTeamPicker, setShowTeamPicker] = useState(false)

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), where('onboardingComplete', '==', true))
    const unsubscribe = onSnapshot(usersQuery, (usersSnap) => {
      const rows = usersSnap.docs
        .map((userDoc) => ({ uid: userDoc.id, ...userDoc.data() } as AppUser))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))

      setPlayers((current) => {
        const readyById = Object.fromEntries(current.map((row) => [row.user.uid, row.ready]))
        return rows.map((appUser) => ({ user: appUser, ready: readyById[appUser.uid] ?? false }))
      })
      setLoading(false)
    }, () => setLoading(false))

    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'teamListStatuses'), (snap) => {
      const readyById: Record<string, boolean> = {}
      for (const statusDoc of snap.docs) readyById[statusDoc.id] = statusDoc.data().ready === true

      setPlayers((current) =>
        current.map((row) => ({ ...row, ready: readyById[row.user.uid] === true })),
      )
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const teamsQuery = query(collection(db, 'teams'), where('drawEligible', '==', true))
    const unsubscribe = onSnapshot(teamsQuery, (snap) => {
      setTeams(
        snap.docs
          .map((teamDoc) => ({ id: teamDoc.id, ...teamDoc.data() } as Team))
          .sort((a, b) => (a.drawSeedOrder ?? 999) - (b.drawSeedOrder ?? 999)),
      )
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'draw', 'state'), (snap) => {
      setDrawState(snap.exists() ? (snap.data() as DrawState) : null)
    })

    return unsubscribe
  }, [])

  const numberOfTeams = config.drawTeamCount ?? teams.length
  const numberOfPlayers = players.length
  const perOwnerLimits = useMemo(() => {
    if (numberOfPlayers === 0 || numberOfTeams === 0) return { min: 0, max: 0 }
    return {
      min: Math.ceil(numberOfTeams / numberOfPlayers),
      max: Math.floor((numberOfTeams * 2) / numberOfPlayers),
    }
  }, [numberOfPlayers, numberOfTeams])

  useEffect(() => {
    if (perOwnerLimits.min === 0 || perOwnerLimits.min > perOwnerLimits.max) return

    const configured = typeof config.teamsPerPlayer === 'number'
      ? config.teamsPerPlayer
      : perOwnerLimits.min
    setSelectedTeamsPerPlayer(
      Math.max(perOwnerLimits.min, Math.min(perOwnerLimits.max, configured)),
    )
  }, [config.teamsPerPlayer, perOwnerLimits.max, perOwnerLimits.min])

  const teamById = useMemo(() => {
    const result: Record<string, Team> = {}
    for (const team of teams) result[team.id] = team
    return result
  }, [teams])

  const playerById = useMemo(() => {
    const result: Record<string, AppUser | DrawState['players'][number]> = {}
    for (const player of players) result[player.user.uid] = player.user
    for (const player of drawState?.players ?? []) result[player.uid] = player
    return result
  }, [drawState?.players, players])

  const readyCount = players.filter((player) => player.ready).length
  const doubleOwnedPreview = selectedTeamsPerPlayer * numberOfPlayers - numberOfTeams
  const canStartDraw =
    isAdmin
    && !busy
    && numberOfPlayers > 0
    && numberOfTeams > 0
    && perOwnerLimits.min <= perOwnerLimits.max
  const currentPlayer = drawState?.currentPlayerId ? playerById[drawState.currentPlayerId] : null
  const selectedTeam = drawState?.currentSelectionTeamId
    ? teamById[drawState.currentSelectionTeamId]
    : null
  const assignmentsByUser = useMemo(
    () => getAssignmentsByUser(drawState?.assignments ?? []),
    [drawState?.assignments],
  )
  const currentPlayerAssignments = currentPlayer ? assignmentsByUser[currentPlayer.uid] ?? [] : []
  const currentPlayerTeams = currentPlayerAssignments
    .map((assignment) => teamById[assignment.teamId])
    .filter((team): team is Team => Boolean(team))
  const isLastPlayer =
    drawState?.status === 'picking'
    && drawState.currentPlayerIndex !== null
    && drawState.currentPlayerIndex >= drawState.currentRoundOrder.length - 1
  const availableTeams = useMemo(() => {
    if (drawState?.status !== 'picking' || !drawState.currentPlayerId) return []

    const isAvailable = getAvailability(
      drawState.assignments,
      drawState.currentPlayerId,
      drawState.doubleOwnedLimit,
    )

    return teams.filter((team) => isAvailable(team.id))
  }, [drawState, teams])

  async function runCallable(name: string, data?: unknown) {
    setBusy(name)
    setError(null)
    try {
      await httpsCallable(functions, name)(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function saveTeamsPerPlayer() {
    setBusy('saveTeamsPerPlayer')
    setError(null)
    try {
      await setDoc(doc(db, 'config', 'app'), {
        teamsPerPlayer: selectedTeamsPerPlayer,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setSavedTeamsPerPlayer(true)
      setTimeout(() => setSavedTeamsPerPlayer(false), 1800)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function startDraw() {
    setShowStartConfirm(false)
    await runCallable('startTeamsDraw', { teamsPerPlayer: selectedTeamsPerPlayer })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <TicketSpinner label="Loading draw" />
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-2">
        <div className="mb-6">
          <p className="ticket-meta text-brand-stamp">★ Team draft</p>
          <h1 className="font-display text-[2.2rem] leading-none text-brand-ink">Draw</h1>
          <p className="text-brand-muted text-sm mt-1">
            {drawState?.status === 'completed'
              ? 'Draw is complete'
              : config.drawStatus === 'draw_day'
                ? 'Draft day'
                : 'List prep'}
          </p>
        </div>

        {error && (
          <div className="mb-4 border-l-4 border-brand-stamp bg-brand-stamp/10 px-4 py-3 text-sm text-brand-stamp">
            {error}
          </div>
        )}

        {drawState && config.drawStatus === 'draw_day' ? (
          <DrawLiveView
            state={drawState}
            teams={teams}
            teamById={teamById}
            playerById={playerById}
            assignmentsByUser={assignmentsByUser}
            currentPlayer={currentPlayer}
            currentPlayerTeams={currentPlayerTeams}
            selectedTeam={selectedTeam}
            isAdmin={isAdmin}
            busy={busy}
            isLastPlayer={isLastPlayer}
            onStartRound={() => runCallable('startTeamsDrawRound')}
            onOpenTeamPicker={() => setShowTeamPicker(true)}
            onAdvance={() => runCallable('advanceTeamsDraw')}
            onComplete={() => runCallable('completeTeamsDraw')}
          />
        ) : (
          <>
            {isAdmin && (
              <AdminSetup
                numberOfTeams={numberOfTeams}
                numberOfPlayers={numberOfPlayers}
                readyCount={readyCount}
                selectedTeamsPerPlayer={selectedTeamsPerPlayer}
                perOwnerLimits={perOwnerLimits}
                doubleOwnedPreview={doubleOwnedPreview}
                busy={busy}
                saved={savedTeamsPerPlayer}
                canStartDraw={canStartDraw}
                onOpenPicker={() => setShowPerOwnerPicker(true)}
                onSave={saveTeamsPerPlayer}
                onStart={() => setShowStartConfirm(true)}
              />
            )}
            <ReadinessList players={players} readyCount={readyCount} />
          </>
        )}
      </div>

      {showStartConfirm && (
        <ConfirmModal
          title="Start the draw?"
          body="All player lists will lock. Players who have not saved a list will use the default ranking order."
          confirmLabel="Start"
          onCancel={() => setShowStartConfirm(false)}
          onConfirm={startDraw}
        />
      )}

      {showPerOwnerPicker && (
        <NumberWheelPicker
          min={perOwnerLimits.min}
          max={perOwnerLimits.max}
          value={selectedTeamsPerPlayer}
          onClose={() => setShowPerOwnerPicker(false)}
          onSelect={(value) => {
            setSelectedTeamsPerPlayer(value)
            setShowPerOwnerPicker(false)
          }}
        />
      )}

      {showTeamPicker && drawState?.currentPlayerId && (
        <TeamPickerModal
          teams={availableTeams}
          selectedTeamId={drawState.currentSelectionTeamId}
          disabled={Boolean(busy)}
          onClose={() => setShowTeamPicker(false)}
          onSelect={async (teamId) => {
            await runCallable('selectTeamsDrawTeam', { teamId })
            setShowTeamPicker(false)
          }}
        />
      )}
    </>
  )
}

function AdminSetup({
  numberOfTeams,
  numberOfPlayers,
  readyCount,
  selectedTeamsPerPlayer,
  perOwnerLimits,
  doubleOwnedPreview,
  busy,
  saved,
  canStartDraw,
  onOpenPicker,
  onSave,
  onStart,
}: {
  numberOfTeams: number
  numberOfPlayers: number
  readyCount: number
  selectedTeamsPerPlayer: number
  perOwnerLimits: { min: number; max: number }
  doubleOwnedPreview: number
  busy: string | null
  saved: boolean
  canStartDraw: boolean
  onOpenPicker: () => void
  onSave: () => void
  onStart: () => void
}) {
  const impossible = perOwnerLimits.min > perOwnerLimits.max

  return (
    <div className="mb-4 space-y-3">
      <div className="ticket-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Settings size={15} className="text-brand-faint" />
          <span className="ticket-meta text-brand-muted">Teams per player</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPicker}
            disabled={impossible || Boolean(busy)}
            className="flex h-11 w-16 items-center justify-center rounded border border-brand-border bg-brand-card font-display text-2xl tabular-nums text-brand-ink disabled:opacity-50"
          >
            {selectedTeamsPerPlayer}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={impossible || Boolean(busy)}
            className="ticket-button rounded bg-brand-accent px-4 py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
          <div className="min-w-0 text-xs text-brand-faint">
            {impossible ? (
              <span>Not possible with this player count.</span>
            ) : (
              <span>
                Allowed: {perOwnerLimits.min}-{perOwnerLimits.max}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Players" value={numberOfPlayers} />
          <Metric label="Teams" value={numberOfTeams} />
          <Metric label="Double-owned" value={Math.max(0, doubleOwnedPreview)} />
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={!canStartDraw}
        className="ticket-button flex w-full items-center justify-center gap-2 rounded bg-brand-accent py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
      >
        <Play size={17} />
        Start Draw
      </button>

      <p className="text-center text-xs text-brand-faint">
        {readyCount}/{numberOfPlayers} players have saved a list
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-brand-border bg-brand-card px-2 py-2">
      <p className="font-display text-lg leading-none text-brand-ink tabular-nums">{value}</p>
      <p className="ticket-meta mt-0.5 truncate text-[0.5rem]">{label}</p>
    </div>
  )
}

function ReadinessList({ players, readyCount }: { players: PlayerStatus[]; readyCount: number }) {
  return (
    <>
      <div className="ticket-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-brand-border bg-brand-card text-brand-stamp">
            <Shuffle size={20} />
          </div>
          <div>
            <p className="font-display text-lg leading-none text-brand-ink">
              {readyCount}/{players.length} ready
            </p>
            <p className="text-xs text-brand-faint">Lists stay private until the draw starts.</p>
          </div>
        </div>
      </div>

      <div className="ticket-card mt-4">
        {players.map((player) => (
          <div
            key={player.user.uid}
            className="flex items-center justify-between border-b border-brand-border px-4 py-3 last:border-0"
          >
            <span className="truncate font-display text-base leading-none text-brand-ink">{player.user.displayName}</span>
            {player.ready ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <Circle size={18} className="text-gray-600" />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function DrawLiveView({
  state,
  teams,
  teamById,
  playerById,
  assignmentsByUser,
  currentPlayer,
  currentPlayerTeams,
  selectedTeam,
  isAdmin,
  busy,
  isLastPlayer,
  onStartRound,
  onOpenTeamPicker,
  onAdvance,
  onComplete,
}: {
  state: DrawState
  teams: Team[]
  teamById: Record<string, Team>
  playerById: Record<string, AppUser | DrawState['players'][number]>
  assignmentsByUser: Record<string, DrawAssignment[]>
  currentPlayer: AppUser | DrawState['players'][number] | null
  currentPlayerTeams: Team[]
  selectedTeam: Team | null
  isAdmin: boolean
  busy: string | null
  isLastPlayer: boolean
  onStartRound: () => void
  onOpenTeamPicker: () => void
  onAdvance: () => void
  onComplete: () => void
}) {
  if (state.status === 'round_intro') {
    return (
      <RoundIntro
        roundNumber={state.roundNumber}
        isAdmin={isAdmin}
        busy={busy}
        onStartRound={onStartRound}
      />
    )
  }

  if (state.status === 'picking' && currentPlayer) {
    return (
      <PickingView
        state={state}
        currentPlayer={currentPlayer}
        currentPlayerTeams={currentPlayerTeams}
        selectedTeam={selectedTeam}
        isAdmin={isAdmin}
        busy={busy}
        isLastPlayer={isLastPlayer}
        onOpenTeamPicker={onOpenTeamPicker}
        onAdvance={onAdvance}
      />
    )
  }

  return (
    <SummaryView
      state={state}
      teams={teams}
      teamById={teamById}
      playerById={playerById}
      assignmentsByUser={assignmentsByUser}
      isAdmin={isAdmin}
      busy={busy}
      onStartRound={onStartRound}
      onComplete={onComplete}
    />
  )
}

function RoundIntro({
  roundNumber,
  isAdmin,
  busy,
  onStartRound,
}: {
  roundNumber: number
  isAdmin: boolean
  busy: string | null
  onStartRound: () => void
}) {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
      <p className="ticket-meta text-brand-stamp">★ Draw round</p>
      <h2 className="font-display text-5xl leading-none text-brand-ink">{getRoundLabel(roundNumber)}</h2>
      {isAdmin ? (
        <button
          type="button"
          onClick={onStartRound}
          disabled={Boolean(busy)}
          className="ticket-button mt-8 flex items-center gap-2 rounded bg-brand-accent px-8 py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
        >
          <Play size={18} />
          Start
        </button>
      ) : (
        <p className="mt-4 text-sm text-brand-faint">Waiting for the round to start.</p>
      )}
    </div>
  )
}

function PickingView({
  state,
  currentPlayer,
  currentPlayerTeams,
  selectedTeam,
  isAdmin,
  busy,
  isLastPlayer,
  onOpenTeamPicker,
  onAdvance,
}: {
  state: DrawState
  currentPlayer: AppUser | DrawState['players'][number]
  currentPlayerTeams: Team[]
  selectedTeam: Team | null
  isAdmin: boolean
  busy: string | null
  isLastPlayer: boolean
  onOpenTeamPicker: () => void
  onAdvance: () => void
}) {
  return (
    <div className="flex min-h-[58vh] flex-col items-center justify-center text-center">
      <p className="ticket-meta mb-5 text-brand-stamp">
        {getRoundLabel(state.roundNumber)}
      </p>
      <LargeAvatar url={currentPlayer.avatarUrl} name={currentPlayer.displayName} />
      <h2 className="mt-4 font-display text-3xl leading-none text-brand-ink">{currentPlayer.displayName}</h2>

      {currentPlayerTeams.length > 0 && (
        <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2">
          {currentPlayerTeams.map((team) => (
            <TeamChip key={team.id} team={team} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenTeamPicker}
        disabled={!isAdmin || Boolean(busy)}
        className="ticket-card mt-8 flex w-full max-w-sm items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:border-brand-ink disabled:cursor-default disabled:hover:border-brand-border"
      >
        {selectedTeam ? (
          <span className="flex min-w-0 items-center gap-3">
            <span className="text-3xl">{selectedTeam.flag}</span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg leading-none text-brand-ink">
                {getCountryName(selectedTeam.name)}
              </span>
              <span className="ticket-meta mt-1 block">Selected team</span>
            </span>
          </span>
        ) : (
          <span className="text-sm font-semibold text-brand-faint">No available team</span>
        )}
        {isAdmin && <ChevronDown size={20} className="shrink-0 text-brand-faint" />}
      </button>

      {isAdmin ? (
        <button
          type="button"
          onClick={onAdvance}
          disabled={Boolean(busy) || !selectedTeam}
          className="ticket-button mt-5 w-full max-w-sm rounded bg-brand-accent py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
        >
          {isLastPlayer ? 'Finish round' : 'Next player'}
        </button>
      ) : (
        <p className="mt-5 text-sm text-brand-faint">Waiting for the pick to be confirmed.</p>
      )}
    </div>
  )
}

function SummaryView({
  state,
  teams,
  teamById,
  playerById,
  assignmentsByUser,
  isAdmin,
  busy,
  onStartRound,
  onComplete,
}: {
  state: DrawState
  teams: Team[]
  teamById: Record<string, Team>
  playerById: Record<string, AppUser | DrawState['players'][number]>
  assignmentsByUser: Record<string, DrawAssignment[]>
  isAdmin: boolean
  busy: string | null
  onStartRound: () => void
  onComplete: () => void
}) {
  const drawFinished = state.roundNumber >= state.roundCount || state.status === 'completed'

  return (
    <div>
      <div className="ticket-card mb-4 flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-brand-border bg-brand-card text-brand-stamp">
          <Users size={20} />
        </div>
        <div>
          <p className="font-display text-lg leading-none text-brand-ink">
            {state.status === 'completed' ? 'Game started' : `${getRoundLabel(state.roundNumber)} complete`}
          </p>
          <p className="ticket-meta mt-1">
            {state.assignments.length}/{state.roundCount * state.numberOfPlayers} assigned
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {state.players.map((player) => {
          const displayPlayer = playerById[player.uid] ?? player
          const assignedTeams = (assignmentsByUser[player.uid] ?? [])
            .map((assignment) => teamById[assignment.teamId])
            .filter((team): team is Team => Boolean(team))

          return (
            <div key={player.uid} className="ticket-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <LargeAvatar
                  url={displayPlayer.avatarUrl}
                  name={displayPlayer.displayName}
                  className="h-10 w-10"
                />
                <p className="min-w-0 truncate font-display text-base leading-none text-brand-ink">{displayPlayer.displayName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {assignedTeams.length === 0 ? (
                  <span className="text-xs italic text-brand-faint">No assigned teams</span>
                ) : (
                  assignedTeams.map((team) => <TeamChip key={team.id} team={team} />)
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isAdmin && state.status !== 'completed' && (
        <button
          type="button"
          onClick={drawFinished ? onComplete : onStartRound}
          disabled={Boolean(busy)}
          className="ticket-button mt-5 w-full rounded bg-brand-accent py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
        >
          {drawFinished ? 'Start Game' : getRoundLabel(state.roundNumber + 1)}
        </button>
      )}

      {teams.length > 0 && (
        <p className="mt-4 text-center text-xs text-brand-faint">
          Double ownership stops after {state.doubleOwnedLimit} teams.
        </p>
      )}
    </div>
  )
}

function TeamChip({ team }: { team: Team }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-brand-border bg-brand-card px-2 py-1 text-xs font-semibold text-brand-muted">
      <span className="text-base leading-none">{team.flag}</span>
      <span className="truncate">{getCountryName(team.name)}</span>
    </span>
  )
}

function LargeAvatar({
  url,
  name,
  className = 'h-28 w-28',
}: {
  url: string | null
  name: string
  className?: string
}) {
  return (
    <div className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-ink text-brand-ticket ring-2 ring-brand-card`}>
      {url?.startsWith('emoji:') ? (
        <span className={className === 'h-28 w-28' ? 'text-5xl leading-none' : 'text-lg leading-none'}>
          {url.replace('emoji:', '')}
        </span>
      ) : url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className={className === 'h-28 w-28' ? 'text-4xl font-black text-brand-ticket' : 'text-sm font-bold text-brand-ticket'}>
          {name[0]?.toUpperCase() ?? '?'}
        </span>
      )}
    </div>
  )
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="ticket-card w-full max-w-sm p-6">
        <h2 className="mb-2 font-display text-2xl leading-none text-brand-ink">{title}</h2>
        <p className="mb-6 text-sm text-brand-muted">{body}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="ticket-button flex-1 rounded border border-brand-border py-3 text-brand-ink transition-colors hover:border-brand-ink"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="ticket-button flex-1 rounded bg-brand-accent py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function NumberWheelPicker({
  min,
  max,
  value,
  onClose,
  onSelect,
}: {
  min: number
  max: number
  value: number
  onClose: () => void
  onSelect: (value: number) => void
}) {
  const options = useMemo(
    () => Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index),
    [max, min],
  )
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState(Math.max(min, Math.min(max, value)))
  const pickerHeight = PICKER_ROW_HEIGHT * PICKER_VISIBLE_ROWS
  const pickerPadding = PICKER_ROW_HEIGHT * Math.floor(PICKER_VISIBLE_ROWS / 2)

  useEffect(() => {
    const index = options.indexOf(selected)
    if (index >= 0) scrollRef.current?.scrollTo({ top: index * PICKER_ROW_HEIGHT })
  }, [options, selected])

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const index = Math.max(
      0,
      Math.min(options.length - 1, Math.round(event.currentTarget.scrollTop / PICKER_ROW_HEIGHT)),
    )
    setSelected(options[index])
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-[430px] rounded-t-2xl border-t border-brand-border bg-brand-card p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-3 font-display text-xl leading-none text-brand-ink">Teams per player</h2>
        <div
          className="relative overflow-hidden rounded-md border border-brand-border bg-brand-card"
          style={{ height: pickerHeight }}
        >
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-11 -translate-y-1/2 border-y border-brand-stamp/45 bg-brand-stamp/5" />
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full snap-y snap-mandatory overflow-y-auto"
            style={{
              paddingTop: pickerPadding,
              paddingBottom: pickerPadding,
              scrollPaddingTop: pickerPadding,
              scrollPaddingBottom: pickerPadding,
            }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelected(option)}
                className={`relative z-20 flex w-full snap-center items-center justify-center text-base font-bold tabular-nums transition-colors ${
                  option === selected ? 'text-brand-ink' : 'text-brand-muted hover:text-brand-ink'
                }`}
                style={{ height: PICKER_ROW_HEIGHT }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(selected)}
          className="mt-3 w-full rounded-lg bg-brand-accent py-3 text-sm font-bold text-brand-bg transition-colors hover:bg-brand-accent-hover"
        >
          Select {selected}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ticket-button mt-3 w-full rounded py-3 text-brand-faint transition-colors hover:text-brand-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function TeamPickerModal({
  teams,
  selectedTeamId,
  disabled,
  onClose,
  onSelect,
}: {
  teams: Team[]
  selectedTeamId: string | null
  disabled: boolean
  onClose: () => void
  onSelect: (teamId: string) => void
}) {
  const [search, setSearch] = useState('')
  const searchLower = search.trim().toLowerCase()
  const filteredTeams = searchLower
    ? teams.filter((team) =>
      team.name.toLowerCase().includes(searchLower)
      || getCountryName(team.name).toLowerCase().includes(searchLower),
    )
    : teams

  return (
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-[430px] rounded-t-2xl border-t border-brand-border bg-brand-card p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-3 font-display text-xl leading-none text-brand-ink">Choose Team</h2>
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search teams..."
          className="mb-3 w-full rounded border border-brand-border bg-brand-card px-3 py-3 text-sm text-brand-ink placeholder-brand-faint focus:border-brand-ink focus:outline-none"
        />
        <div className="max-h-[46vh] overflow-y-auto rounded-md border border-brand-border">
          {filteredTeams.length === 0 ? (
            <p className="px-4 py-4 text-sm text-brand-faint">No available teams.</p>
          ) : (
            filteredTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(team.id)}
                className="flex w-full items-center justify-between border-b border-brand-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-brand-border disabled:opacity-50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">{team.flag}</span>
                  <span className="truncate text-sm font-semibold text-brand-ink">
                    {getCountryName(team.name)}
                  </span>
                </span>
                {team.id === selectedTeamId && <CheckCircle2 size={18} className="shrink-0 text-brand-accent" />}
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ticket-button mt-3 w-full rounded py-3 text-brand-faint transition-colors hover:text-brand-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
