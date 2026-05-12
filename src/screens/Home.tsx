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

function formatMatchDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMatchTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { matches, loading, error } = useUpcomingMatches(HOME_MATCH_WINDOW)
  const { predictions } = useUserPredictions(user?.uid)

  // Collect all team IDs from upcoming matches so we can look up their owners
  const allTeamIds = useMemo(
    () => [...new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))],
    [matches],
  )
  const { owners } = useTeamOwners(allTeamIds)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Upcoming Matches</h1>
        <p className="text-gray-400 text-sm mt-1">World Cup 26</p>
      </div>

      <div className="space-y-4">
        {error && (
          <p className="text-red-300 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3 text-sm">
            {error} Refresh the page in a minute.
          </p>
        )}

        {matches.length === 0 && (
          <p className="text-gray-500 text-center py-10">No upcoming matches.</p>
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
              className="bg-brand-card border border-brand-border rounded-xl overflow-hidden"
            >
              <div className="p-4">
                {/* Date / venue row */}
                <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                  <span>{formatMatchDate(match.date)} · {formatMatchTime(match.date)}</span>
                  <span className="text-gray-500">{match.venue}</span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-3">
                  <TeamCol
                    flag={match.homeTeam.flag}
                    name={getCountryName(match.homeTeam.name)}
                    owners={homeOwners}
                  />
                  {isLocked && match.homeScore !== null && match.awayScore !== null ? (
                    <div className="flex flex-col items-center px-3">
                      {match.status === 'live' && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">
                          {match.statusShort === 'HT'
                            ? 'Halftime'
                            : match.statusShort === 'BT'
                              ? 'Awaiting extra time'
                              : match.statusShort === 'P'
                                ? 'Awaiting penalties'
                                : match.minute !== null
                                  ? `${match.minute}'`
                                  : 'Live'}
                        </span>
                      )}
                      <span className="text-white font-bold text-xl tabular-nums">{match.homeScore} – {match.awayScore}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 font-bold text-lg px-3">VS</span>
                  )}
                  <TeamCol
                    flag={match.awayTeam.flag}
                    name={getCountryName(match.awayTeam.name)}
                    owners={awayOwners}
                    align="right"
                  />
                </div>

                {/* Predict button / submitted state */}
                {isLocked ? (
                  hasPredicted ? (
                    <button
                      onClick={() => navigate(`/match/${match.id}`)}
                      className="w-full py-3 bg-emerald-900/40 border border-emerald-700 text-emerald-400 font-semibold rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-emerald-900/60 transition-colors"
                    >
                      <CheckCircle2 size={18} />
                      You predicted {predictions[match.id].outcome} · Locked
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-brand-border text-gray-500 font-semibold rounded-lg text-center text-sm">
                      No prediction · Locked
                    </div>
                  )
                ) : hasPredicted ? (
                  <button
                    onClick={() => navigate(`/match/${match.id}`)}
                    className="w-full py-3 bg-emerald-900/40 border border-emerald-700 text-emerald-400 font-semibold rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-emerald-900/60 transition-colors"
                  >
                    <CheckCircle2 size={18} />
                    You predicted {predictions[match.id].outcome} · Edit
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/match/${match.id}`)}
                    className="w-full py-3 bg-brand-accent text-brand-bg font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-accent-hover transition-colors"
                  >
                    Predict
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Finished matches link */}
      <button
        onClick={() => navigate('/finished')}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-border text-gray-400 text-sm font-semibold hover:border-gray-500 hover:text-white transition-colors"
      >
        <History size={16} />
        Finished Matches
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
    <div className={`flex-1 flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="text-4xl mb-1">{flag}</span>
      {owners.length > 0 ? (
        <>
          <span className={`max-w-full text-xs text-gray-400 mt-0.5 ${textAlign}`}>{name}</span>
          <span className={`max-w-full font-semibold text-white text-sm ${textAlign}`}>
            {owners.join(', ')}
          </span>
        </>
      ) : (
        <span className={`max-w-full font-semibold text-white text-sm ${textAlign}`}>{name}</span>
      )}
    </div>
  )
}
