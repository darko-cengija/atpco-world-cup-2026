import { useEffect, useMemo, useRef, useState } from 'react'
import { Reorder, useDragControls, type PanInfo } from 'framer-motion'
import { GripVertical, Hash } from 'lucide-react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { getCountryName } from '@/lib/translations'
import { useDrawConfig } from '@/hooks/useDrawConfig'
import type { Team } from '@/types'
import { TicketSpinner } from '@/components/TicketMark'

const RANKING_SNAPSHOT = 'FIFA/Coca-Cola Men’s World Ranking, 1 April 2026'
const PICKER_ROW_HEIGHT = 44
const PICKER_VISIBLE_ROWS = 5
const DRAG_SCROLL_EDGE = 88
const DRAG_SCROLL_MIN_STEP = 1.5
const DRAG_SCROLL_MAX_STEP = 7

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function normalizeOrder(savedIds: string[], teams: Team[]) {
  const validIds = new Set(teams.map((team) => team.id))
  const saved = savedIds.filter((id) => validIds.has(id))
  const missing = teams.map((team) => team.id).filter((id) => !saved.includes(id))
  return [...saved, ...missing]
}

function moveId(ids: string[], id: string, toIndex: number) {
  const fromIndex = ids.indexOf(id)
  if (fromIndex === -1) return ids
  const next = [...ids]
  const [item] = next.splice(fromIndex, 1)
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, item)
  return next
}

function getViewportY(event: MouseEvent | TouchEvent | PointerEvent) {
  if ('touches' in event) {
    return event.touches[0]?.clientY ?? event.changedTouches[0]?.clientY ?? null
  }

  return event.clientY
}

export default function MyTeamList() {
  const { user } = useAuth()
  const { config } = useDrawConfig()
  const locked = config.drawStatus !== 'list_building'
  const configuredTeamCount = config.drawTeamCount
  const rankingSnapshot = config.drawRankingSnapshot ?? RANKING_SNAPSHOT

  const [teams, setTeams] = useState<Team[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [pickerTeamId, setPickerTeamId] = useState<string | null>(null)

  const loadedRef = useRef(false)
  const lastSavedRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    const currentUser = user
    let cancelled = false

    async function load() {
      setLoading(true)

      const teamsSnap = await getDocs(collection(db, 'teams'))
      const allTeams = teamsSnap.docs
        .map((teamDoc) => ({ id: teamDoc.id, ...teamDoc.data() } as Team))
        .filter((team) => team.drawEligible === true)
        .sort((a, b) => (a.drawSeedOrder ?? 999) - (b.drawSeedOrder ?? 999))

      const listRef = doc(db, 'teamLists', currentUser.uid)
      const listSnap = await getDoc(listRef)
      const savedIds = listSnap.exists() ? ((listSnap.data().teamIds as string[] | undefined) ?? []) : []
      const nextOrder = normalizeOrder(savedIds, allTeams)
      const expectedTeamCount = configuredTeamCount ?? allTeams.length

      if (cancelled) return

      setTeams(allTeams)
      setOrder(nextOrder)
      lastSavedRef.current = nextOrder.join(',')
      loadedRef.current = true
      setLoading(false)

      if (!listSnap.exists() && allTeams.length > 0 && config.drawStatus === 'list_building') {
        await Promise.all([
          setDoc(listRef, {
            userId: currentUser.uid,
            teamIds: nextOrder,
            teamCount: nextOrder.length,
            rankingSnapshot,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          setDoc(doc(db, 'teamListStatuses', currentUser.uid), {
            userId: currentUser.uid,
            ready: nextOrder.length === expectedTeamCount,
            teamCount: nextOrder.length,
            updatedAt: serverTimestamp(),
          }),
        ])
      } else if (allTeams.length > 0 && config.drawStatus === 'list_building') {
        await setDoc(doc(db, 'teamListStatuses', currentUser.uid), {
          userId: currentUser.uid,
          ready: nextOrder.length === expectedTeamCount,
          teamCount: nextOrder.length,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
    }

    load().catch(() => {
      if (!cancelled) {
        setLoading(false)
        setSaveStatus('error')
      }
    })

    return () => {
      cancelled = true
    }
  }, [config.drawStatus, configuredTeamCount, rankingSnapshot, user])

  useEffect(() => {
    if (!user || !loadedRef.current || locked || order.length === 0) return

    const serialized = order.join(',')
    if (serialized === lastSavedRef.current) return
    const expectedTeamCount = configuredTeamCount ?? teams.length

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')

    saveTimerRef.current = setTimeout(async () => {
      try {
        await Promise.all([
          setDoc(doc(db, 'teamLists', user.uid), {
            userId: user.uid,
            teamIds: order,
            teamCount: order.length,
            rankingSnapshot,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
          setDoc(doc(db, 'teamListStatuses', user.uid), {
            userId: user.uid,
            ready: order.length === expectedTeamCount,
            teamCount: order.length,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
        ])
        lastSavedRef.current = serialized
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 600)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [configuredTeamCount, locked, order, rankingSnapshot, teams.length, user])

  const teamById = useMemo(() => {
    const result: Record<string, Team> = {}
    for (const team of teams) result[team.id] = team
    return result
  }, [teams])

  const orderedTeams = useMemo(
    () => order.map((id) => teamById[id]).filter((team): team is Team => Boolean(team)),
    [order, teamById],
  )

  function moveTeam(teamId: string, toIndex: number) {
    if (locked) return
    setOrder((current) => moveId(current, teamId, toIndex))
  }

  const pickerTeam = pickerTeamId ? teamById[pickerTeamId] : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <TicketSpinner label="Loading list" />
      </div>
    )
  }

  return (
    <div className="px-4 py-2">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="ticket-meta text-brand-stamp">★ Draft order</p>
            <h1 className="font-display text-[2.2rem] leading-none text-brand-ink">My List</h1>
            <p className="text-brand-muted text-sm mt-1">{rankingSnapshot}</p>
          </div>
          <SaveBadge locked={locked} status={saveStatus} />
        </div>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-border text-brand-faint text-center py-10">Teams have not been added yet.</p>
      ) : (
        <Reorder.Group
          as="div"
          axis="y"
          values={order}
          onReorder={(nextOrder) => {
            if (!locked) setOrder(nextOrder)
          }}
          className="space-y-2"
        >
          {orderedTeams.map((team, index) => (
            <TeamRow
              key={team.id}
              team={team}
              rank={index + 1}
              disabled={locked}
              onOpenPicker={() => setPickerTeamId(team.id)}
            />
          ))}
        </Reorder.Group>
      )}

      {pickerTeam && (
        <PositionPicker
          team={pickerTeam}
          currentIndex={order.indexOf(pickerTeam.id)}
          max={order.length}
          onClose={() => setPickerTeamId(null)}
          onSelect={(nextIndex) => {
            moveTeam(pickerTeam.id, nextIndex)
            setPickerTeamId(null)
          }}
        />
      )}
    </div>
  )
}

function SaveBadge({ locked, status }: { locked: boolean; status: SaveStatus }) {
  const label = locked
    ? 'Locked'
    : status === 'saving'
      ? 'Saving...'
      : status === 'error'
        ? 'Error'
        : 'Saved'

  return (
    <span
      className={`ticket-pill shrink-0 ${
        locked
          ? 'border-brand-gold/60 bg-brand-gold/10 text-brand-gold'
          : status === 'error'
            ? 'border-brand-stamp/70 bg-brand-stamp/10 text-brand-stamp'
            : 'border-emerald-800/70 bg-emerald-700/10 text-emerald-700'
      }`}
    >
      {label}
    </span>
  )
}

function TeamRow({
  team,
  rank,
  disabled,
  onOpenPicker,
}: {
  team: Team
  rank: number
  disabled: boolean
  onOpenPicker: () => void
}) {
  const localizedName = getCountryName(team.name)
  const dragControls = useDragControls()
  const autoScrollFrameRef = useRef<number | null>(null)
  const autoScrollStepRef = useRef(0)

  useEffect(() => stopAutoScroll, [])

  function stopAutoScroll() {
    autoScrollStepRef.current = 0
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current)
      autoScrollFrameRef.current = null
    }
  }

  function startAutoScrollLoop() {
    if (autoScrollFrameRef.current !== null) return

    const tick = () => {
      const step = autoScrollStepRef.current
      if (step === 0) {
        autoScrollFrameRef.current = null
        return
      }

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const atTop = window.scrollY <= 0
      const atBottom = window.scrollY >= maxScroll - 1

      if ((step < 0 && atTop) || (step > 0 && atBottom)) {
        stopAutoScroll()
        return
      }

      window.scrollBy(0, step)
      autoScrollFrameRef.current = window.requestAnimationFrame(tick)
    }

    autoScrollFrameRef.current = window.requestAnimationFrame(tick)
  }

  function getAutoScrollStep(intensity: number) {
    const clamped = Math.max(0, Math.min(1, intensity))
    return DRAG_SCROLL_MIN_STEP + clamped * clamped * (DRAG_SCROLL_MAX_STEP - DRAG_SCROLL_MIN_STEP)
  }

  function updateAutoScroll(viewportY: number) {
    if (viewportY < DRAG_SCROLL_EDGE) {
      autoScrollStepRef.current = -getAutoScrollStep(1 - viewportY / DRAG_SCROLL_EDGE)
      startAutoScrollLoop()
      return
    }

    const bottomDistance = window.innerHeight - viewportY
    if (bottomDistance < DRAG_SCROLL_EDGE) {
      autoScrollStepRef.current = getAutoScrollStep(1 - bottomDistance / DRAG_SCROLL_EDGE)
      startAutoScrollLoop()
      return
    }

    stopAutoScroll()
  }

  function handleDrag(event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) {
    const viewportY = getViewportY(event)
    if (viewportY === null) {
      stopAutoScroll()
      return
    }

    updateAutoScroll(viewportY)
  }

  return (
    <Reorder.Item
      as="div"
      value={team.id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.02,
        zIndex: 30,
        boxShadow: '0 16px 30px rgba(0,0,0,0.28)',
      }}
      onDragStart={stopAutoScroll}
      onDrag={handleDrag}
      onDragEnd={stopAutoScroll}
      className="grid grid-cols-[2rem_2.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-brand-border bg-brand-card px-2.5 py-2 shadow-sm"
    >
      <span className="text-center text-sm font-semibold tabular-nums text-gray-400">{rank}</span>
      <span className="text-2xl leading-none" title={localizedName} aria-label={localizedName}>
        {team.flag}
      </span>
      <span className="block min-w-0 truncate font-display text-base leading-none text-brand-ink max-[360px]:text-sm">
        {localizedName}
      </span>
      <div className="flex items-center gap-1 justify-self-end">
        <IconButton label="Move to position" disabled={disabled} onClick={onOpenPicker}>
          <Hash size={17} />
        </IconButton>
        <button
          type="button"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          disabled={disabled}
          onPointerDown={(event) => {
            if (!disabled) {
              stopAutoScroll()
              dragControls.start(event)
            }
          }}
          className="flex h-8 w-8 touch-none items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-brand-border hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <GripVertical size={18} />
        </button>
      </div>
    </Reorder.Item>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-brand-faint transition-colors hover:bg-brand-border hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function PositionPicker({
  team,
  currentIndex,
  max,
  onClose,
  onSelect,
}: {
  team: Team
  currentIndex: number
  max: number
  onClose: () => void
  onSelect: (nextIndex: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(currentIndex)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: currentIndex * PICKER_ROW_HEIGHT })
  }, [currentIndex])

  const localizedName = getCountryName(team.name)
  const pickerHeight = PICKER_ROW_HEIGHT * PICKER_VISIBLE_ROWS
  const pickerPadding = PICKER_ROW_HEIGHT * Math.floor(PICKER_VISIBLE_ROWS / 2)

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const nextIndex = Math.max(
      0,
      Math.min(max - 1, Math.round(event.currentTarget.scrollTop / PICKER_ROW_HEIGHT)),
    )
    setSelectedIndex(nextIndex)
  }

  function scrollToIndex(index: number) {
    scrollRef.current?.scrollTo({ top: index * PICKER_ROW_HEIGHT, behavior: 'smooth' })
    setSelectedIndex(index)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-[430px] rounded-t-2xl border-t border-brand-border bg-brand-card p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="text-3xl">{team.flag}</span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl leading-none text-brand-ink">{localizedName}</h2>
            <p className="ticket-meta mt-1">Current #{currentIndex + 1}</p>
          </div>
        </div>

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
            {Array.from({ length: max }, (_, index) => {
              const selected = index === selectedIndex
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`relative z-20 flex w-full snap-center items-center justify-center text-base font-bold tabular-nums transition-colors ${
                    selected ? 'text-brand-ink' : 'text-brand-muted hover:text-brand-ink'
                  }`}
                  style={{ height: PICKER_ROW_HEIGHT }}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(selectedIndex)}
          className="ticket-button mt-3 w-full rounded bg-brand-accent py-3 text-brand-bg transition-colors hover:bg-brand-accent-hover"
        >
          Move to #{selectedIndex + 1}
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
