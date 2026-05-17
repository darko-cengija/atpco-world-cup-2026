import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, CheckCircle2, History } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpcomingMatches } from '@/hooks/useUpcomingMatches'
import { HOME_MATCH_WINDOW } from '@/lib/config'
import { useTeamOwners } from '@/hooks/useTeamOwners'
import { useUserPredictions } from '@/hooks/useUserPredictions'
import { getCountryName } from '@/lib/translations'
import { useDrawConfig } from '@/hooks/useDrawConfig'
import { TicketSpinner } from '@/components/TicketMark'
import type { Match } from '@/types'

function formatMatchDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMatchTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatLiveClock(match: Match) {
  if (match.statusShort === 'HT') return 'Halftime'
  if (match.statusShort === 'BT') return 'Awaiting extra time'
  if (match.statusShort === 'P') return 'Awaiting penalties'
  if (match.minute === null) return 'Live'

  const stoppageTime = match.stoppageTime !== null && match.stoppageTime > 0
    ? `+${match.stoppageTime}`
    : ''

  return `${match.minute}${stoppageTime}'`
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { matches, loading, error } = useUpcomingMatches(HOME_MATCH_WINDOW)
  const { predictions } = useUserPredictions(user?.uid)
  const { config } = useDrawConfig()

  // Collect all team IDs from upcoming matches so we can look up their owners
  const allTeamIds = useMemo(
    () => [...new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))],
    [matches],
  )
  const { owners } = useTeamOwners(allTeamIds)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <TicketSpinner label="Loading fixtures" />
      </div>
    )
  }

  return (
    <div className="px-4 py-2">
      <div className="mb-6 px-1">
        <div className="ticket-meta mb-2 flex items-center gap-2 text-brand-stamp">
          <span>★</span>
          <span>Group Stage</span>
          <span className="h-px flex-1 bg-brand-border" />
          <span>{matches.length || HOME_MATCH_WINDOW} fixtures</span>
        </div>
        <h1 className="font-display text-[2.6rem] leading-none text-brand-ink">Upcoming<br />matches</h1>
        <p className="ticket-meta mt-2">{config.competitionName ?? 'World Cup 26'}</p>
      </div>

      <div className="space-y-4">
        {error && (
          <p className="border-l-4 border-brand-stamp bg-brand-stamp/10 px-4 py-3 text-sm text-brand-stamp">
            {error} Refresh the page in a minute.
          </p>
        )}

        {matches.length === 0 && (
          <p className="rounded-xl border border-dashed border-brand-border py-10 text-center text-sm text-brand-faint">No upcoming matches.</p>
        )}

        {matches.map((match, index) => {
          const hasPredicted = Boolean(predictions[match.id])
          const isLocked = match.status === 'live' || match.status === 'finished'
          const homeOwners = owners[match.homeTeamId] ?? []
          const awayOwners = owners[match.awayTeamId] ?? []

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="ticket-card"
            >
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-brand-border px-4 py-3">
                  <div>
                    <p className="ticket-meta">{isLocked ? 'In play' : 'Kick-off'}</p>
                    <p className="font-display text-2xl leading-none text-brand-ink">{formatMatchDate(match.date).replace(', 2026', '')}</p>
                    <p className="font-mono text-xs tabular-nums text-brand-ink">{formatMatchTime(match.date)}</p>
                  </div>
                  <div className="text-right">
                    {match.status === 'live' ? (
                      <span className="ticket-pill ticket-pill-stamp shrink-0 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 animate-[tkPulse_1.4s_ease-in-out_infinite] rounded-full bg-brand-stamp" />
                        {formatLiveClock(match)}
                      </span>
                    ) : (
                      <p className="ticket-meta">Venue</p>
                    )}
                    <p className="mt-1 max-w-[9.5rem] text-sm font-semibold leading-tight text-brand-ink">{match.venue}</p>
                  </div>
                </div>

                <div className="ticket-tear"><div className="ticket-tear-line" /></div>

                {/* Teams */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-4 py-5">
                  <TeamCol
                    flag={match.homeTeam.flag}
                    name={getCountryName(match.homeTeam.name)}
                    owners={homeOwners}
                  />
                  {isLocked && match.homeScore !== null && match.awayScore !== null ? (
                    <div className="flex flex-col items-center self-center px-3">
                      <span className="font-display text-3xl leading-none text-brand-ink tabular-nums">{match.homeScore}:{match.awayScore}</span>
                    </div>
                  ) : (
                    <span className="grid h-10 w-10 place-items-center self-center rounded-full border-2 border-brand-ink bg-brand-card font-display text-sm text-brand-ink">vs</span>
                  )}
                  <TeamCol
                    flag={match.awayTeam.flag}
                    name={getCountryName(match.awayTeam.name)}
                    owners={awayOwners}
                    align="right"
                  />
                </div>

                {/* Predict button / submitted state */}
                <div className="flex items-center justify-between gap-3 border-t border-dashed border-brand-border px-4 py-3">
                  <div className="ticket-meta">
                    Match #{String(index + 1).padStart(3, '0')}<br />
                    <span className="text-brand-muted">{match.homeTeamId.slice(0, 3)}-{match.awayTeamId.slice(0, 3)}</span>
                  </div>
                  {isLocked ? (
                    hasPredicted ? (
                      <button
                        onClick={() => navigate(`/match/${match.id}`)}
                        className="ticket-button inline-flex items-center gap-2 rounded border border-brand-border px-3 py-2 text-brand-ink"
                      >
                        <CheckCircle2 size={15} />
                        {predictions[match.id].outcome} · Locked
                      </button>
                    ) : (
                      <div className="ticket-pill">No prediction · Locked</div>
                    )
                  ) : hasPredicted ? (
                    <button
                      onClick={() => navigate(`/match/${match.id}`)}
                      className="inline-flex items-center gap-3"
                    >
                      <span className="ticket-stamp">Predicted · {predictions[match.id].outcome}</span>
                      <span className="ticket-button rounded border border-brand-ink px-3 py-2 text-brand-ink">Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/match/${match.id}`)}
                      className="ticket-button flex items-center justify-center gap-2 rounded bg-brand-accent px-4 py-3 text-brand-bg hover:bg-brand-accent-hover transition-colors"
                    >
                      Predict
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Finished matches link */}
      <button
        onClick={() => navigate('/finished')}
        className="ticket-card mt-6 flex w-full items-center justify-between px-4 py-4 text-brand-ink transition-colors hover:border-brand-ink"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded border-2 border-brand-gold text-brand-gold">
            <History size={15} />
          </span>
          <span>
            <span className="block font-display text-lg leading-none">Finished matches</span>
            <span className="ticket-meta">Stubs · Archive</span>
          </span>
        </span>
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function TeamCol({
  flag,
  name,
  owners,
  align = 'left',
}: {
  flag: string
  name: string
  owners: string[]
  align?: 'left' | 'right'
}) {
  const textAlign = align === 'right' ? 'text-right' : 'text-left'

  return (
    <div className={`min-w-0 flex-1 flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="mb-2 grid h-9 min-w-12 place-items-center rounded border border-brand-border bg-brand-card px-2 text-3xl shadow-sm">{flag}</span>
      <span className={`max-w-full break-words font-display text-xl leading-tight text-brand-ink ${textAlign}`}>{name}</span>
      {owners.length > 0 && (
        <span className={`mt-1 max-w-full break-words text-sm font-bold leading-tight text-brand-stamp ${textAlign}`}>
          {owners.join(', ')}
        </span>
      )}
    </div>
  )
}
