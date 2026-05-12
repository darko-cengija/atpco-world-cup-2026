import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { useMainStandings } from '@/hooks/useMainStandings'
import { useWinningChances } from '@/hooks/useWinningChances'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/Avatar'
import { functions } from '@/firebase'

// Columns are in natural football standings order (left → right):
//   # | Player | Pld | W | D | L | GF | GA | GD | Pts
//
// Priority controls visibility (higher = shown first as space grows):
//  1  #      always
//  2  Player always
//  3  Pts    always  (rightmost, where points live)
//  4  Pld    always
//  5  GD     always
//  6  W      min-[390px]
//  7  D      min-[430px]
//  8  L      sm: (desktop + landscape phones)
//  9  GF     sm:
// 10  GA     sm:

const TH = 'px-2 py-2 font-medium text-[10px] uppercase tracking-wider text-gray-500 whitespace-nowrap'
const TD = 'px-2 py-3 text-sm text-center text-gray-300'

export default function MainStandings() {
  const { standings, loading } = useMainStandings()
  const { chances, loading: chancesLoading } = useWinningChances()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [toastMessage, setToastMessage] = useState('')
  const [refreshingChances, setRefreshingChances] = useState(false)
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current)
    }
  }, [])

  function showToast(message: string) {
    setToastMessage(message)
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 1800)
  }

  async function handleRefreshWinningChances() {
    if (refreshingChances) return
    setRefreshingChances(true)
    try {
      const refreshWinningChancesNow = httpsCallable(functions, 'refreshWinningChancesNow')
      await refreshWinningChancesNow({})
      showToast('Winning chances refreshed')
    } catch {
      showToast('Refresh failed')
    } finally {
      setRefreshingChances(false)
    }
  }

  return (
    <div className="px-4 py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Standings</h1>
        <p className="text-gray-400 text-sm mt-1">Based on results from your teams</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : standings.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          No results yet. Standings will appear after matches are played.
        </p>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <colgroup>
              <col className="w-7" />                                    {/* # */}
              <col className="w-[150px]" />                              {/* Player */}
              <col className="w-8" />                                    {/* Pld */}
              <col className="w-8 hidden min-[390px]:table-column" />    {/* W */}
              <col className="w-8 hidden min-[430px]:table-column" />    {/* D */}
              <col className="w-8 hidden sm:table-column" />             {/* L */}
              <col className="w-9 hidden sm:table-column" />             {/* GF */}
              <col className="w-9 hidden sm:table-column" />             {/* GA */}
              <col className="w-9" />                                    {/* GD */}
              <col className="w-9" />                                    {/* Pts */}
            </colgroup>

            <thead>
              <tr className="border-b border-brand-border">
                <th className={`${TH} text-left pl-3`}>#</th>
                <th className={`${TH} text-left pl-1`}>Player</th>
                <th className={TH}>Pld</th>
                <th className={`${TH} hidden min-[390px]:table-cell`}>W</th>
                <th className={`${TH} hidden min-[430px]:table-cell`}>D</th>
                <th className={`${TH} hidden sm:table-cell`}>L</th>
                <th className={`${TH} hidden sm:table-cell`}>GF</th>
                <th className={`${TH} hidden sm:table-cell`}>GA</th>
                <th className={TH}>GD</th>
                <th className={`${TH} text-gray-400 pr-3`}>Pts</th>
              </tr>
            </thead>

            <tbody>
              {standings.map((row, i) => {
                const isMe = row.userId === user?.uid
                return (
                  <tr
                    key={row.userId}
                    onClick={() => navigate(`/player/${row.userId}`)}
                    className={`border-b border-brand-border last:border-0 cursor-pointer hover:bg-white/5 ${isMe ? 'bg-brand-accent/5' : ''}`}
                  >
                    {/* # */}
                    <td className="pl-3 pr-1 py-3 text-sm text-gray-500 font-medium">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>

                    {/* Player */}
                    <td className="pl-1 pr-2 py-3 max-w-[150px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar url={row.avatarUrl} name={row.displayName} className="w-7 h-7" />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-sm font-semibold truncate ${isMe ? 'text-brand-accent' : 'text-white'}`}>
                            {row.displayName}
                            {isMe && <span className="text-xs ml-1 font-normal opacity-60">(you)</span>}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">
                            {row.teams.map((t) => t.flag).join(' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Pld - played */}
                    <td className={TD}>{row.played}</td>

                    {/* W - wins */}
                    <td className={`${TD} hidden min-[390px]:table-cell`}>{row.won}</td>

                    {/* D - draws */}
                    <td className={`${TD} hidden min-[430px]:table-cell`}>{row.drawn}</td>

                    {/* L - losses */}
                    <td className={`${TD} hidden sm:table-cell`}>{row.lost}</td>

                    {/* GF - goals for */}
                    <td className={`${TD} hidden sm:table-cell`}>{row.gf}</td>

                    {/* GA - goals against */}
                    <td className={`${TD} hidden sm:table-cell`}>{row.ga}</td>

                    {/* GD - goal diff */}
                    <td className={TD}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>

                    {/* Pts - points, bold */}
                    <td className={`${TD} font-bold text-white pr-3`}>{row.points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <section className="mt-8">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Winning Chances</h2>
              <p className="text-gray-400 text-sm mt-1">Based on a Monte Carlo simulation of remaining matches</p>
            </div>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={handleRefreshWinningChances}
                disabled={refreshingChances}
                className="mt-1 inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-brand-border bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshingChances ? 'animate-spin' : ''} />
                <span>{refreshingChances ? 'Refreshing' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {chancesLoading ? (
            <div className="bg-brand-card border border-brand-border rounded-xl flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chances.length === 0 ? (
            <p className="bg-brand-card border border-brand-border rounded-xl text-gray-500 text-center py-8">
              Winning chances will appear after the next calculation.
            </p>
          ) : (
            <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className={`${TH} text-left pl-3`}>Player</th>
                    <th className={`${TH} text-right`}>Chance</th>
                    <th className={`${TH} text-right pr-3`}>
                      <button
                        type="button"
                        onClick={() => showToast('Expected points')}
                        className="text-inherit uppercase tracking-wider"
                      >
                        exp. pts
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chances.map((row) => {
                    const isMe = row.userId === user?.uid
                    return (
                      <tr
                        key={row.userId}
                        onClick={() => {
                          if (!row.projectedTeams?.length) {
                            showToast('Simulation is not available yet')
                            return
                          }
                          navigate(`/player/${row.userId}?projection=1`)
                        }}
                        className={`border-b border-brand-border last:border-0 cursor-pointer hover:bg-white/5 ${isMe ? 'bg-brand-accent/5' : ''}`}
                      >
                        <td className="pl-3 pr-2 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar url={row.avatarUrl} name={row.displayName} className="w-7 h-7" />
                            <span className={`text-sm font-semibold truncate ${isMe ? 'text-brand-accent' : 'text-white'}`}>
                              {row.displayName}
                              {isMe && <span className="text-xs ml-1 font-normal opacity-60">(you)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="pl-2 pr-2 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-16 min-[390px]:w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand-accent"
                                style={{ width: `${row.chancePercent}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-sm font-bold text-white">
                              {row.chancePercent}%
                            </span>
                          </div>
                        </td>
                        <td className="pl-1 pr-3 py-3 text-right text-sm font-semibold tabular-nums text-white">
                          {typeof row.expectedPoints === 'number' ? row.expectedPoints.toFixed(1) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-brand-border bg-brand-card px-4 py-2 text-sm font-semibold text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
