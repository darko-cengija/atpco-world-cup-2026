import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, RefreshCw, Repeat2, Trash2 } from 'lucide-react'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDocFromServer,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { fifaMemberAssociations, type FifaMemberAssociation } from '@/data/fifaMemberAssociations'
import { getReplacementOptions } from '@/lib/teamReplacementOptions'
import { getCountryName } from '@/lib/translations'
import type { AppUser, Team } from '@/types'

interface PlayerRow {
  user: AppUser
  teams: Team[]
}

interface Config {
  teamsPerPlayer: number
}

export default function PlayersAndTeams() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [rows, setRows] = useState<PlayerRow[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<Config>({ teamsPerPlayer: 48 })
  const [loading, setLoading] = useState(true)
  const [gameStartedAt, setGameStartedAt] = useState<Timestamp | null>(null)
  const [showStopModal, setShowStopModal] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [replacingTeam, setReplacingTeam] = useState(false)
  const [replaceError, setReplaceError] = useState<string | null>(null)
  const [replaceNotice, setReplaceNotice] = useState<string | null>(null)
  const [togglingGame, setTogglingGame] = useState(false)
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const configSnap = await getDocFromServer(doc(db, 'config', 'app'))
    if (configSnap.exists()) {
      const cfg = configSnap.data() as Config
      setConfig(cfg)
      const gsa = configSnap.data()?.gameStartedAt as Timestamp | undefined
      setGameStartedAt(gsa ?? null)
    }
    const teamsQuery = query(collection(db, 'teams'), where('drawEligible', '==', true))
    const teamsSnap = await getDocs(teamsQuery)
    const teams: Team[] = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Team))
    setAllTeams(teams.sort((a, b) => a.name.localeCompare(b.name)))

    // Load all players
    const usersSnap = await getDocs(collection(db, 'users'))
    const players = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser))

    // For each player, find their assigned teams
    const playerRows: PlayerRow[] = []
    for (const player of players) {
      const ptSnap = await getDocs(
        query(collection(db, 'playerTeams'), where('userId', '==', player.uid)),
      )
      const assignedTeamIds = ptSnap.docs.map((d) => d.data().teamId as string)
      const assignedTeams = teams.filter((t) => assignedTeamIds.includes(t.id))
      playerRows.push({ user: player, teams: assignedTeams })
    }

    setRows(playerRows)
    setLoading(false)
  }

  async function assignTeam(userId: string, team: Team) {
    const docId = `${userId}_${team.id}`
    await setDoc(doc(db, 'playerTeams', docId), { userId, teamId: team.id })
    setRows((prev) =>
      prev.map((r) =>
        r.user.uid === userId && !r.teams.find((t) => t.id === team.id)
          ? { ...r, teams: [...r.teams, team] }
          : r,
      ),
    )
  }

  async function removeTeam(userId: string, teamId: string) {
    const docId = `${userId}_${teamId}`
    await deleteDoc(doc(db, 'playerTeams', docId))
    setRows((prev) =>
      prev.map((r) =>
        r.user.uid === userId ? { ...r, teams: r.teams.filter((t) => t.id !== teamId) } : r,
      ),
    )
  }

  async function handleGameToggle() {
    if (gameStartedAt) {
      setShowStopModal(true)
    } else {
      setTogglingGame(true)
      try {
        const now = Timestamp.now()
        await setDoc(doc(db, 'config', 'app'), { drawStatus: 'completed', gameStartedAt: now }, { merge: true })
        setGameStartedAt(now)
      } finally {
        setTogglingGame(false)
      }
    }
  }

  async function handleStopGame() {
    setTogglingGame(true)
    try {
      const resetDraw = httpsCallable(functions, 'resetTeamsDrawForTesting')
      await resetDraw()
      setGameStartedAt(null)
      setShowStopModal(false)
      await load()
    } finally {
      setTogglingGame(false)
    }
  }

  async function replaceTeam(droppedTeamId: string, replacement: FifaMemberAssociation, fifaRank: number | null) {
    setReplacingTeam(true)
    setReplaceError(null)
    setReplaceNotice(null)
    try {
      const replaceWorldCupTeam = httpsCallable(functions, 'replaceWorldCupTeam')
      const result = await replaceWorldCupTeam({
        droppedTeamId,
        replacement: {
          id: replacement.id,
          fifaRank,
        },
      })
      const warnings = (result.data as { warnings?: string[] } | undefined)?.warnings ?? []
      if (warnings.length > 0) setReplaceNotice(warnings.join(' '))
      setShowReplaceModal(false)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Replacement failed.'
      setReplaceError(
        message === 'internal'
          ? 'Replacement failed. If you are testing locally, deploy the new Cloud Function before replacing a real team.'
          : message,
      )
    } finally {
      setReplacingTeam(false)
    }
  }

  async function deletePlayer(playerUser: AppUser) {
    setDeletingUid(playerUser.uid)

    // Delete all playerTeams for this user
    const ptSnap = await getDocs(
      query(collection(db, 'playerTeams'), where('userId', '==', playerUser.uid)),
    )
    for (const d of ptSnap.docs) await deleteDoc(d.ref)

    // Delete all predictions for this user
    const predSnap = await getDocs(
      query(collection(db, 'predictions'), where('userId', '==', playerUser.uid)),
    )
    for (const d of predSnap.docs) await deleteDoc(d.ref)

    // Remove from allowedUsers (by email) so they can't re-join
    const allowedSnap = await getDocs(
      query(collection(db, 'allowedUsers'), where('email', '==', playerUser.email)),
    )
    for (const d of allowedSnap.docs) await deleteDoc(d.ref)

    // Delete the user profile document last
    await deleteDoc(doc(db, 'users', playerUser.uid))

    setRows((prev) => prev.filter((r) => r.user.uid !== playerUser.uid))
    setDeletingUid(null)
    setConfirmDeleteUid(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    {/* Stop-game confirmation modal */}
    {showStopModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 max-w-sm w-full">
          <h2 className="text-white font-bold text-lg mb-2">Stop tracking?</h2>
          <p className="text-gray-400 text-sm mb-6">
            This will reset the draw, return lists to the FIFA ranking, and delete assigned teams.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStopModal(false)}
              className="flex-1 py-3 rounded-xl border border-brand-border text-gray-300 font-semibold hover:text-white transition-colors"
            >
              No
            </button>
            <button
              onClick={handleStopGame}
              disabled={togglingGame}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="px-4 py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Players and Teams</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isAdmin ? 'Assign teams to players' : 'Assigned teams'}
        </p>
      </div>

      {/* Admin-only: game start toggle */}
      {isAdmin && (
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-300">Game started</span>
              {gameStartedAt ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  Since {gameStartedAt.toDate().toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              ) : (
                <p className="text-xs text-gray-600 mt-0.5">Points are not counted</p>
              )}
            </div>
            <button
              onClick={handleGameToggle}
              disabled={togglingGame}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                gameStartedAt ? 'bg-brand-accent' : 'bg-brand-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                  gameStartedAt ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            setReplaceError(null)
            setReplaceNotice(null)
            setShowReplaceModal(true)
          }}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-card py-3 text-sm font-bold text-white transition-colors hover:border-gray-600"
        >
          <Repeat2 size={16} />
          Replace Team
        </button>
      )}

      {/* Player rows */}
      <div className="space-y-4">
        {rows.map((row, i) => (
          <motion.div
            key={row.user.uid}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-brand-card border border-brand-border rounded-xl p-4"
          >
            {/* Player header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand-border flex items-center justify-center overflow-hidden shrink-0">
                {row.user.avatarUrl?.startsWith('emoji:') ? (
                  <span className="text-lg">{row.user.avatarUrl.replace('emoji:', '')}</span>
                ) : row.user.avatarUrl ? (
                  <img src={row.user.avatarUrl} alt={row.user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-brand-accent">
                    {row.user.displayName?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white">{row.user.displayName}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {row.teams.length}/{config.teamsPerPlayer} teams
                </span>
              </div>

              {/* Admin delete — not shown for self */}
              {isAdmin && row.user.uid !== user?.uid && (
                confirmDeleteUid === row.user.uid ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">Delete?</span>
                    <button
                      onClick={() => deletePlayer(row.user)}
                      disabled={deletingUid === row.user.uid}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {deletingUid === row.user.uid ? '...' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUid(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteUid(row.user.uid)}
                    className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                )
              )}
            </div>

            {/* Assigned teams */}
            <div className="flex flex-wrap gap-2 mb-3">
              {row.teams.length === 0 && (
                <span className="text-xs text-gray-600 italic">No assigned teams</span>
              )}
              {row.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-1 bg-brand-bg border border-brand-border rounded-lg px-2 py-1"
                >
                  <span className="text-base">{team.flag}</span>
                  <span className="text-xs text-gray-300">{getCountryName(team.name)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => removeTeam(row.user.uid, team.id)}
                      className="ml-1 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Admin: team picker */}
            {isAdmin && (
              <TeamPicker
                allTeams={allTeams}
                assignedTeamIds={row.teams.map((t) => t.id)}
                onAdd={(team) => assignTeam(row.user.uid, team)}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
    {showReplaceModal && (
      <ReplaceTeamModal
        activeTeams={allTeams}
        replacementOptions={getReplacementOptions(fifaMemberAssociations, allTeams)}
        busy={replacingTeam}
        error={replaceError}
        notice={replaceNotice}
        onClose={() => setShowReplaceModal(false)}
        onConfirm={replaceTeam}
      />
    )}
    </>
  )
}

function ReplaceTeamModal({
  activeTeams,
  replacementOptions,
  busy,
  error,
  notice,
  onClose,
  onConfirm,
}: {
  activeTeams: Team[]
  replacementOptions: FifaMemberAssociation[]
  busy: boolean
  error: string | null
  notice: string | null
  onClose: () => void
  onConfirm: (droppedTeamId: string, replacement: FifaMemberAssociation, fifaRank: number | null) => void
}) {
  const [droppedTeamId, setDroppedTeamId] = useState(activeTeams[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [replacementId, setReplacementId] = useState('')
  const [fifaRank, setFifaRank] = useState('')

  const selectedDroppedTeam = activeTeams.find((team) => team.id === droppedTeamId) ?? null
  const selectedReplacement = replacementOptions.find((team) => team.id === replacementId) ?? null
  const searchLower = search.trim().toLowerCase()
  const filteredReplacements = searchLower
    ? replacementOptions.filter((team) =>
      team.name.toLowerCase().includes(searchLower)
      || getCountryName(team.name).toLowerCase().includes(searchLower)
      || team.confederation.toLowerCase().includes(searchLower),
    )
    : replacementOptions
  const rankNumber = fifaRank.trim() ? Number(fifaRank) : null
  const rankValid = rankNumber === null || (Number.isInteger(rankNumber) && rankNumber > 0)
  const canConfirm = Boolean(selectedDroppedTeam && selectedReplacement && rankValid && !busy)

  function selectReplacement(team: FifaMemberAssociation) {
    setReplacementId(team.id)
    setSearch('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] max-w-[430px] overflow-y-auto rounded-t-2xl border-t border-brand-border bg-brand-card p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <Repeat2 size={18} className="text-brand-accent" />
          <h2 className="text-lg font-bold text-white">Replace Team</h2>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-800/70 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-3 rounded-lg border border-amber-700/70 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
            {notice}
          </div>
        )}

        <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
          Dropped team
        </label>
        <select
          value={droppedTeamId}
          onChange={(event) => setDroppedTeamId(event.target.value)}
          className="mb-4 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-3 text-sm font-semibold text-white focus:border-brand-accent focus:outline-none"
        >
          {activeTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.flag} {getCountryName(team.name)}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
          New team
        </label>
        {selectedReplacement && (
          <div className="mb-3 rounded-xl border-2 border-brand-accent bg-brand-accent/10 p-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-accent">
              Selected replacement
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="text-3xl">{selectedReplacement.flag}</span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-white">
                    {getCountryName(selectedReplacement.name)}
                  </span>
                  <span className="block text-xs text-gray-400">{selectedReplacement.confederation}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setReplacementId('')}
                className="shrink-0 rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
              >
                Change
              </button>
            </div>
          </div>
        )}
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={selectedReplacement ? 'Search for another replacement...' : 'Search FIFA members...'}
          className="mb-3 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-accent focus:outline-none"
        />
        <div className="mb-4 max-h-56 overflow-y-auto rounded-xl border border-brand-border">
          {filteredReplacements.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-600">No available teams.</p>
          ) : (
            filteredReplacements.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => selectReplacement(team)}
                className={`flex w-full items-center justify-between border-b px-4 py-3 text-left transition-colors last:border-0 ${
                  team.id === replacementId
                    ? 'border-brand-accent/40 bg-brand-accent/10'
                    : 'border-brand-border hover:bg-brand-bg'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">{team.flag}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {getCountryName(team.name)}
                    </span>
                    <span className="block text-xs text-gray-500">{team.confederation}</span>
                  </span>
                </span>
                {team.id === replacementId && <CheckMark />}
              </button>
            ))
          )}
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
          FIFA rank
        </label>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={fifaRank}
          onChange={(event) => setFifaRank(event.target.value)}
          placeholder="Optional"
          className="mb-2 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-accent focus:outline-none"
        />
        {!rankValid && <p className="mb-3 text-xs text-red-300">Rank must be a positive whole number.</p>}

        {selectedDroppedTeam && selectedReplacement && (
          <div className="mb-4 rounded-xl border border-brand-border bg-brand-bg p-3 text-sm text-gray-300">
            <span className="font-semibold text-white">
              {selectedDroppedTeam.flag} {getCountryName(selectedDroppedTeam.name)}
            </span>
            <span className="px-2 text-gray-500">→</span>
            <span className="font-semibold text-white">
              {selectedReplacement.flag} {getCountryName(selectedReplacement.name)}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => selectedReplacement && onConfirm(droppedTeamId, selectedReplacement, rankNumber)}
          disabled={!canConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-bold text-brand-bg transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
        >
          {busy ? <RefreshCw size={16} className="animate-spin" /> : <Repeat2 size={16} />}
          Replace
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="mt-3 w-full rounded-lg py-3 text-sm font-semibold text-gray-500 transition-colors hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function CheckMark() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-black text-brand-bg">
      ✓
    </span>
  )
}

function TeamPicker({
  allTeams,
  assignedTeamIds,
  onAdd,
}: {
  allTeams: Team[]
  assignedTeamIds: string[]
  onAdd: (team: Team) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const searchLower = search.toLowerCase()
  const unassigned = allTeams.filter(
    (t) =>
      !assignedTeamIds.includes(t.id) &&
      (t.name.toLowerCase().includes(searchLower) ||
        getCountryName(t.name).toLowerCase().includes(searchLower)),
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-brand-accent hover:text-white transition-colors mt-1"
      >
        <Plus size={13} />
        Add Team
      </button>
    )
  }

  return (
    <div className="mt-2 border border-brand-border rounded-xl overflow-hidden">
      <input
        autoFocus
        type="text"
        placeholder="Search teams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-brand-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none border-b border-brand-border"
      />
      <div className="max-h-40 overflow-y-auto">
        {unassigned.length === 0 && (
          <p className="text-xs text-gray-600 px-3 py-2 italic">No available teams</p>
        )}
        {unassigned.map((team) => (
          <button
            key={team.id}
            onClick={() => {
              onAdd(team)
              setSearch('')
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-brand-border hover:text-white transition-colors text-left"
          >
            <span>{team.flag}</span>
            <span>{getCountryName(team.name)}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setOpen(false)}
        className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 border-t border-brand-border transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
