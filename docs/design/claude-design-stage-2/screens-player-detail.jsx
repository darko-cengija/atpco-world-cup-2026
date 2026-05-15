// Player Detail — one player's tickets pulled into a single screen.
//
// Top section:  Back header  +  large avatar + name + small meta strip
// Middle:       Team stats table (one row per owned team + Total row).
// Bottom:       Predictions list — each finished match as a mini stub:
//                date · matchup · score · actual outcome · player's pick.
//
// Projection mode swaps the team-stats table for decimal projected values
// and pins a fixed bottom banner explaining the simulation.

// ─────────────────────────── HERO ───────────────────────────

function PlayerHero({ player, summary, projection }) {
  return (
    <div style={{ padding: '4px 20px 16px' }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>★</span> Player
        <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        <span style={{ color: C3.ink50 }}>{projection ? 'Projection' : 'Live'}</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <TKAvatar
          kind={player.kind} initial={player.initial} emoji={player.emoji}
          size={64} ring={player.tag === 'you' ? C3.stamp : undefined}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: C3.display, fontSize: 32, color: C3.ink,
            lineHeight: 1, letterSpacing: -0.6, textWrap: 'pretty',
          }}>
            {player.name}
            {player.tag === 'you' && (
              <span style={{
                marginLeft: 8, fontFamily: C3.mono, fontSize: 12,
                color: C3.stamp, letterSpacing: 1.4, textTransform: 'uppercase',
                verticalAlign: 'middle', fontWeight: 700,
              }}>(you)</span>
            )}
          </div>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 8,
          }}>{player.joined}</div>
        </div>
      </div>
      {/* Inline ticket-style meta strip */}
      <div style={{
        marginTop: 16,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
        border: `1px dashed ${C3.ink20}`, borderRadius: 8,
        background: 'rgba(15,58,53,0.03)',
      }}>
        {summary.map((s, i) => (
          <div key={s.label} style={{
            padding: '10px 12px',
            borderLeft: i === 0 ? 'none' : `1px dashed ${C3.ink20}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase',
            }}>{s.label}</div>
            <div style={{
              fontFamily: C3.display, fontSize: 19, color: s.tone === 'stamp' ? C3.stamp : C3.ink,
              lineHeight: 1, marginTop: 4, fontVariantNumeric: 'tabular-nums',
            }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── TEAM STATS TABLE ───────────────────────────
//
// Same grid as the main standings dense form, but with a flag + team name
// in the "Player" slot. The Total row is a stamped strip — dashed top
// border, mono caps "Total" label, Pts pops in display.

function teamGridCols(form) {
  // [flag] [name flex] [Pld W D L] [GF GA] [GD] [Pts]
  if (form === 'wide') {
    return '24px 1fr 22px 22px 22px 22px 24px 24px 28px 36px';
  }
  return '22px 1fr 20px 20px 20px 20px 28px 36px';
}

function TeamStatsHeader({ form = 'compact' }) {
  const wide = form === 'wide';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: teamGridCols(form),
      alignItems: 'center', gap: wide ? 6 : 5,
      padding: '0 14px 8px',
      borderBottom: `1px solid ${C3.ink20}`,
    }}>
      <span />
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>Team</span>
      <span style={COL_HEAD_STYLE}>P</span>
      <span style={COL_HEAD_STYLE}>W</span>
      <span style={COL_HEAD_STYLE}>D</span>
      <span style={COL_HEAD_STYLE}>L</span>
      {wide && <span style={COL_HEAD_STYLE}>GF</span>}
      {wide && <span style={COL_HEAD_STYLE}>GA</span>}
      <span style={COL_HEAD_STYLE}>GD</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'right' }}>Pts</span>
    </div>
  );
}

function TeamStatsRow({ t, form = 'compact', last, projection }) {
  const wide = form === 'wide';
  const ptsStyle = {
    fontFamily: C3.display, fontSize: 18, color: C3.ink, textAlign: 'right',
    fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4, lineHeight: 1,
  };
  const numStyle = {
    ...NUM_STYLE,
    fontSize: projection ? 11 : 12,
  };
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: teamGridCols(form),
      alignItems: 'center', gap: wide ? 6 : 5,
      padding: '11px 14px',
      borderBottom: last ? 'none' : `1px solid ${C3.ink20}`,
    }}>
      <span style={{
        width: 22, height: 15, borderRadius: 2, overflow: 'hidden',
        boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
        justifySelf: 'start',
      }}>{FLAGS[t.code]}</span>
      <span style={{
        fontFamily: C3.display, fontSize: 15, color: C3.ink,
        lineHeight: 1.05, letterSpacing: -0.1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{t.name}</span>
      <span style={numStyle}>{t.pld}</span>
      <span style={numStyle}>{t.w}</span>
      <span style={numStyle}>{t.d}</span>
      <span style={numStyle}>{t.l}</span>
      {wide && <span style={numStyle}>{t.gf}</span>}
      {wide && <span style={numStyle}>{t.ga}</span>}
      <span style={{
        ...numStyle, fontWeight: 600,
        color: String(t.gd).trim().startsWith('-') ? C3.stamp : C3.ink70,
      }}>{t.gd}</span>
      <span style={ptsStyle}>{t.pts}</span>
    </div>
  );
}

function TeamStatsTotal({ total, form = 'compact', projection }) {
  const wide = form === 'wide';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: teamGridCols(form),
      alignItems: 'center', gap: wide ? 6 : 5,
      padding: '12px 14px 13px',
      borderTop: `1.5px dashed ${C3.ink20}`,
      background: 'rgba(15,58,53,0.04)',
    }}>
      <span />
      <span style={{
        fontFamily: C3.mono, fontSize: 11, color: C3.ink,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
      }}>Total</span>
      <span style={{ ...NUM_STYLE, color: C3.ink, fontWeight: 700 }}>{total.pld}</span>
      <span style={{ ...NUM_STYLE, color: C3.ink, fontWeight: 700 }}>{total.w}</span>
      <span style={{ ...NUM_STYLE, color: C3.ink, fontWeight: 700 }}>{total.d}</span>
      <span style={{ ...NUM_STYLE, color: C3.ink, fontWeight: 700 }}>{total.l}</span>
      {wide && <span style={{ ...NUM_STYLE, color: C3.ink, fontWeight: 700 }}>{total.gf}</span>}
      {wide && <span style={{ ...NUM_STYLE, color: C3.ink, fontWeight: 700 }}>{total.ga}</span>}
      <span style={{
        ...NUM_STYLE, fontWeight: 700,
        color: String(total.gd).trim().startsWith('-') ? C3.stamp : C3.ink,
      }}>{total.gd}</span>
      <span style={{
        fontFamily: C3.display, fontSize: 22, color: C3.ink, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.6, lineHeight: 1,
      }}>{total.pts}</span>
    </div>
  );
}

function TeamStatsTable({ rows, total, form = 'compact', projection }) {
  return (
    <div>
      <TeamStatsHeader form={form} />
      {rows.map((t, i) => (
        <TeamStatsRow key={t.code} t={t} form={form} projection={projection}
          last={i === rows.length - 1} />
      ))}
      <TeamStatsTotal total={total} form={form} projection={projection} />
    </div>
  );
}

// ─────────────────────────── PREDICTION ROW ───────────────────────────

// Tiny status disc — hit (green) · miss (stamp-red) · missing (dashed).
function StatusDisc({ status }) {
  const styles = {
    hit:     { bg: '#1f6a4d', fg: C3.ticket, border: '#1f6a4d', glyph: ICONS.check },
    miss:    { bg: 'transparent', fg: C3.stamp, border: C3.stamp,
               glyph: <svg viewBox="0 0 24 24" fill="none">
                 <path d="M6 6l12 12M18 6L6 18" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round"/>
               </svg> },
    none:    { bg: 'transparent', fg: C3.ink50, border: C3.ink50, glyph: (
               <svg viewBox="0 0 24 24" fill="none">
                 <path d="M5 12h14" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round"/>
               </svg>), dashed: true },
  }[status];
  return (
    <span style={{
      width: 26, height: 26, borderRadius: '50%',
      background: styles.bg, color: styles.fg,
      border: `${styles.dashed ? '1.5px dashed' : '1.5px solid'} ${styles.border}`,
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <span style={{ width: 14, height: 14 }}>{styles.glyph}</span>
    </span>
  );
}

// One prediction row — a compact stub. Two-line layout so it scans on phone.
function PredictionRow({ p, last }) {
  const statusCopy = {
    hit:  { label: 'Correct',   color: '#1f6a4d', delta: p.delta },
    miss: { label: 'Incorrect', color: C3.stamp,  delta: p.delta },
    none: { label: 'No pick',   color: C3.ink50,  delta: p.delta },
  }[p.status];
  return (
    <div style={{
      padding: '12px 14px',
      borderBottom: last ? 'none' : `1px solid ${C3.ink20}`,
      display: 'flex', flexDirection: 'column', gap: 9,
    }}>
      {/* row 1 — date + stage + status disc */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: C3.mono, fontSize: 11, color: C3.ink,
            letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}>{p.date}</span>
          <span style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1, textTransform: 'uppercase',
          }}>· {p.stage}</span>
        </div>
        <StatusDisc status={p.status} />
      </div>
      {/* row 2 — matchup + score */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          width: 22, height: 15, borderRadius: 2, overflow: 'hidden',
          boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
        }}>{FLAGS[p.home.code]}</span>
        <span style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1, fontWeight: 600,
        }}>{p.home.short}</span>
        <span style={{
          fontFamily: C3.display, fontSize: 18, color: C3.ink,
          lineHeight: 1, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums',
          padding: '0 6px',
        }}>{p.score.home}<span style={{ color: C3.ink50, padding: '0 4px' }}>–</span>{p.score.away}</span>
        <span style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1, fontWeight: 600,
        }}>{p.away.short}</span>
        <span style={{
          width: 22, height: 15, borderRadius: 2, overflow: 'hidden',
          boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
        }}>{FLAGS[p.away.code]}</span>
        <span style={{ flex: 1 }} />
      </div>
      {/* row 3 — actual outcome + player pick + delta */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', borderRadius: 4,
          background: 'rgba(15,58,53,0.06)',
        }}>
          <span style={{
            fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
            letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700,
          }}>Actual</span>
          <span style={{
            fontFamily: C3.display, fontSize: 14, color: C3.ink,
            letterSpacing: 0.5, lineHeight: 1,
          }}>{p.actual}</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', borderRadius: 4,
          background: p.status === 'hit'  ? 'rgba(31,106,77,0.10)' :
                      p.status === 'miss' ? 'rgba(168,57,43,0.10)' :
                                            'rgba(15,58,53,0.04)',
          border: p.status === 'none' ? `1.5px dashed ${C3.ink20}` : 'none',
        }}>
          <span style={{
            fontFamily: C3.mono, fontSize: 8,
            color: p.status === 'hit'  ? '#1f6a4d' :
                   p.status === 'miss' ? C3.stamp :
                                         C3.ink50,
            letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700,
          }}>Pick</span>
          <span style={{
            fontFamily: C3.display, fontSize: 14,
            color: p.status === 'hit'  ? '#1f6a4d' :
                   p.status === 'miss' ? C3.stamp :
                                         C3.ink50,
            letterSpacing: 0.5, lineHeight: 1,
          }}>{p.pick == null ? '—' : p.pick}</span>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: C3.mono, fontSize: 11,
          color: statusCopy.color, fontWeight: 700,
          letterSpacing: 0.6, fontVariantNumeric: 'tabular-nums',
        }}>{p.delta} pts</span>
      </div>
      {/* row 4 (optional) — penalty / extra-time line */}
      {p.score.decided && (
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
          letterSpacing: 0.5, marginTop: -2,
        }}>{p.score.decided}</div>
      )}
    </div>
  );
}

// ─────────────────────────── PROJECTION BANNER ───────────────────────────

function ProjectionBanner() {
  return (
    <div style={{
      ...paperTexture(C3.ink),
      color: C3.ticket,
      padding: '12px 18px',
      borderTop: `1px solid rgba(0,0,0,0.25)`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 4,
        border: `1.5px solid rgba(246,239,219,0.5)`,
        display: 'grid', placeItems: 'center', flexShrink: 0,
        fontFamily: C3.mono, fontSize: 9, letterSpacing: 1.4,
        fontWeight: 700,
      }}>SIM</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: 'rgba(246,239,219,0.7)',
          letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
        }}>Projection mode</div>
        <div style={{
          fontFamily: C3.sans, fontSize: 13, color: C3.ticket, fontWeight: 500,
          lineHeight: 1.35, marginTop: 2, textWrap: 'pretty',
        }}>
          Simulation: average of 10,000 scenarios for remaining matches.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── SHELLS ───────────────────────────

function PlayerDetailDefault() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Player" eyebrow="Pool · Live" />
        <PlayerHero
          player={DARKO}
          summary={[
            { label: 'Pool rank', value: '#5' },
            { label: 'Team pts',  value: '6' },
            { label: 'Pred pts',  value: '+3.42', tone: 'stamp' },
          ]}
        />
        <PaperBoard
          eyebrow="Team Stats"
          title="Owned teams"
          subtitle="Results from teams Darko owns in this pool.">
          <TeamStatsTable
            rows={DARKO_TEAM_STATS}
            total={DARKO_TEAM_TOTAL}
            form="compact"
          />
        </PaperBoard>
        <PaperBoard
          eyebrow="Predictions"
          title="Predictions"
          subtitle="One stub per finished match. Hit · miss · no-pick.">
          {DARKO_PREDICTIONS.map((p, i) => (
            <PredictionRow key={p.id} p={p}
              last={i === DARKO_PREDICTIONS.length - 1} />
          ))}
        </PaperBoard>
        <div style={{ height: 12 }} />
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Projection mode — same screen, decimal values, banner pinned to bottom.
function PlayerDetailProjection() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Player" eyebrow="Pool · Projection" />
        <PlayerHero
          player={DARKO}
          projection
          summary={[
            { label: 'Proj rank', value: '#5' },
            { label: 'Proj pts',  value: '13.7' },
            { label: 'Win %',     value: '7%', tone: 'stamp' },
          ]}
        />
        <PaperBoard
          eyebrow="Projection · Team Stats"
          title="Projected end-state"
          subtitle="Decimal values are simulation averages — not actual results.">
          <TeamStatsTable
            rows={DARKO_TEAM_PROJ}
            total={DARKO_TEAM_PROJ_TOTAL}
            form="compact"
            projection
          />
        </PaperBoard>
        <PaperBoard
          eyebrow="Predictions"
          title="Predictions"
          subtitle="Past stubs aren't projected — historical hits stay frozen.">
          {DARKO_PREDICTIONS.slice(0, 3).map((p, i) => (
            <PredictionRow key={p.id} p={p} last={i === 2} />
          ))}
        </PaperBoard>
        {/* spacer for fixed banner */}
        <div style={{ height: 72 }} />
      </div>
      {/* Fixed bottom banner — sits above the bottom nav. */}
      <ProjectionBanner />
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Empty — finished matches haven't happened yet
function PlayerDetailEmptyPredictions() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Player" eyebrow="Pool · Pre-tournament" />
        <PlayerHero
          player={DARKO}
          summary={[
            { label: 'Pool rank', value: '—' },
            { label: 'Team pts',  value: '0' },
            { label: 'Pred pts',  value: '0.00' },
          ]}
        />
        <PaperBoard
          eyebrow="Team Stats"
          title="Owned teams"
          subtitle="No matches have been played yet.">
          <TeamStatsTable
            rows={DARKO_TEAM_STATS.map(t => ({
              ...t, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: ' 0', pts: 0,
            }))}
            total={{ pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: ' 0', pts: 0 }}
            form="compact"
          />
        </PaperBoard>
        <PaperBoard
          eyebrow="Predictions"
          title="Predictions"
          subtitle="Stubs will appear here as matches finish.">
          <div style={{ padding: '0 14px 18px' }}>
            <TKEmpty
              title="No finished matches yet."
              body="Once the first match wraps, every prediction this player has made will land here."
            />
          </div>
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  PlayerHero,
  TeamStatsHeader, TeamStatsRow, TeamStatsTotal, TeamStatsTable,
  StatusDisc, PredictionRow, ProjectionBanner,
  PlayerDetailDefault, PlayerDetailProjection, PlayerDetailEmptyPredictions,
});
