// Finished Matches screen.
//
// Reached from the bottom "Finished matches · stubs · archive" link on the
// Upcoming Matches home, or from the Standings/Players surfaces.
//
// Each finished card extends the ticket vocabulary:
//   ┌─ stage + date strip
//   ├─ matchup with final score (replaces VS)
//   ├─ "Actual outcome" stamp (1 / X / X1 / X2 / 2)
//   └─ chip grid: every player's prediction (correct · incorrect · missing)
//
// Three list-level states: loading, empty, populated.

// ─────────────────────────── PREDICTION CHIP ───────────────────────────

// Status: 'correct' (green ink) · 'wrong' (stamp-red) · 'missing' (dashed)
function PredictionChip({ player, status }) {
  const styles = {
    correct: {
      bd: '#1f6a4d', fg: '#1f6a4d', bg: 'rgba(31,106,77,0.08)',
      ringFg: '#1f6a4d', ringBg: '#1f6a4d', stamp: 'HIT',
    },
    wrong: {
      bd: C3.stamp, fg: C3.stamp, bg: 'rgba(168,57,43,0.06)',
      ringFg: C3.stamp, ringBg: 'transparent', stamp: null,
    },
    missing: {
      bd: C3.ink20, fg: C3.ink50, bg: 'transparent',
      ringFg: C3.ink50, ringBg: 'transparent', stamp: null,
    },
  }[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px 7px 7px', borderRadius: 6,
      border: `1.5px ${status === 'missing' ? 'dashed' : 'solid'} ${styles.bd}`,
      background: styles.bg, fontFamily: C3.sans,
      position: 'relative', minWidth: 0,
      ...(player.you ? { boxShadow: `inset 0 0 0 1px ${C3.stamp}55` } : {}),
    }}>
      <TKAvatar
        kind={player.kind}
        initial={player.initial}
        emoji={player.emoji}
        size={26}
        ring={player.you ? C3.stamp : undefined}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.sans, fontSize: 12,
          color: player.you ? C3.stamp : C3.ink, fontWeight: 600,
          lineHeight: 1, letterSpacing: -0.05,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{player.name}{player.you ? ' (you)' : ''}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 8, color: styles.fg,
          letterSpacing: 1.2, marginTop: 3, textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {status === 'missing' ? 'No prediction' :
           status === 'correct' ? '+ 1 pt' : 'Missed'}
        </div>
      </div>
      <span style={{
        display: 'inline-grid', placeItems: 'center',
        minWidth: 30, height: 26, padding: '0 6px', borderRadius: 4,
        border: `1.5px solid ${styles.ringFg}`, background: styles.ringBg,
        color: status === 'correct' ? C3.ticket : styles.ringFg,
        fontFamily: C3.display, fontSize: 14, letterSpacing: 0.3,
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>{player.pick == null ? '—' : player.pick}</span>
    </div>
  );
}

// ─────────────────────────── FINISHED MATCH CARD ───────────────────────────

function FinishedCard({ m }) {
  const stat = (p) => {
    if (p.pick == null) return 'missing';
    return p.pick === m.actual ? 'correct' : 'wrong';
  };
  const correctCount = m.players.filter(p => stat(p) === 'correct').length;

  return (
    <div style={{
      margin: '0 16px 16px',
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Top strip — stage + date */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: `1px solid ${C3.ink20}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>★ {m.stage}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 0.6, fontVariantNumeric: 'tabular-nums',
        }}>{m.dayLabel}</div>
      </div>

      {/* Matchup with final score */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 8, padding: '14px 14px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FlagSquare code={m.home.code} size={42} radius={4} />
          <div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>{m.home.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 16, color: C3.ink,
              lineHeight: 1.05, marginTop: 2, textWrap: 'pretty', maxWidth: 120 }}>
              {m.home.name}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <div style={{
            fontFamily: C3.display, fontSize: 28, color: C3.ink,
            lineHeight: 1, letterSpacing: -0.6,
            fontVariantNumeric: 'tabular-nums',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{m.score.home}</span>
            <span style={{ color: C3.ink50, fontSize: 18 }}>:</span>
            <span>{m.score.away}</span>
          </div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>
            {m.score.decided === 'pen' ? 'after pens' :
             m.score.decided === 'aet' ? 'after extra time' : 'Full time'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>{m.away.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 16, color: C3.ink,
              lineHeight: 1.05, marginTop: 2, textWrap: 'pretty', maxWidth: 120 }}>
              {m.away.name}
            </div>
          </div>
          <FlagSquare code={m.away.code} size={42} radius={4} />
        </div>
      </div>

      {m.score.decidedBy && (
        <div style={{
          padding: '0 16px 6px',
          fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
          letterSpacing: 0.8, textAlign: 'center',
        }}>{m.score.decidedBy}</div>
      )}

      <Perforation />

      {/* Outcome row + hit count */}
      <div style={{
        padding: '18px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
          }}>
            Actual<br/>outcome
          </div>
          <OutcomeStamp value={m.actual} tone="stamp" rotate={-3} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: C3.display, fontSize: 22, color: C3.ink, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {correctCount}<span style={{ color: C3.ink50, fontSize: 14 }}>/{m.players.length}</span>
          </div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2,
          }}>Hit rate</div>
        </div>
      </div>

      {/* Chips */}
      <div style={{
        padding: '0 14px 16px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {m.players.map(p => (
          <PredictionChip key={p.name} player={p} status={stat(p)} />
        ))}
      </div>

      {/* Legend stub */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '10px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.2, textTransform: 'uppercase',
      }}>
        <span>Match #{String(m.id).padStart(3, '0')}</span>
        <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2,
              background: '#1f6a4d' }} />Hit
          </span>
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2,
              border: `1.5px solid ${C3.stamp}` }} />Miss
          </span>
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2,
              border: `1.5px dashed ${C3.ink20}` }} />None
          </span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────── SHELL & STATES ───────────────────────────

function FinishedShell({ children, subtitle }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader
          title="Finished Matches"
          eyebrow={subtitle || 'Stubs · archive'}
        />
        {children}
      </div>
      <BottomNav variant="live" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Populated — all finished matches with chip grids
function FinishedMatchesScreen() {
  return (
    <FinishedShell subtitle={`${FINISHED_MATCHES.length} stubs filed`}>
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>★</span> Archive
          <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
          <span style={{ color: C3.ink50 }}>{FINISHED_MATCHES.length} stubs</span>
        </div>
        <div style={{
          fontFamily: C3.display, fontSize: 30, color: C3.ink,
          lineHeight: 1, letterSpacing: -0.4, textWrap: 'pretty',
        }}>
          Played &amp; counted
        </div>
        <div style={{
          fontFamily: C3.sans, fontSize: 13, color: C3.ink70,
          marginTop: 6, lineHeight: 1.45,
        }}>
          Every stub shows the final score, the actual outcome, and how each player called it.
        </div>
      </div>
      {FINISHED_MATCHES.map(m => <FinishedCard key={m.id} m={m} />)}
    </FinishedShell>
  );
}

// Loading — skeleton stubs
function FinishedLoading() {
  return (
    <FinishedShell subtitle="Loading…">
      <div style={{ padding: '0 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TKSkeletonTicket />
        <TKSkeletonTicket />
      </div>
    </FinishedShell>
  );
}

// Empty — no finished matches yet (early in the tournament)
function FinishedEmpty() {
  return (
    <FinishedShell subtitle="No stubs yet">
      <div style={{ padding: '20px 20px' }}>
        <div style={{
          ...paperTexture(C3.ticket),
          borderRadius: 14, padding: '32px 22px',
          boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative perforation top + bottom */}
          <div style={{
            position: 'absolute', left: -8, top: '50%',
            transform: 'translateY(-50%)',
            width: 16, height: 16, borderRadius: '50%', background: C3.paper,
          }} />
          <div style={{
            position: 'absolute', right: -8, top: '50%',
            transform: 'translateY(-50%)',
            width: 16, height: 16, borderRadius: '50%', background: C3.paper,
          }} />
          <div style={{
            margin: '0 auto 16px', width: 64, height: 64, borderRadius: 8,
            border: `2px dashed ${C3.ink20}`, color: C3.ink50,
            display: 'grid', placeItems: 'center',
          }}>
            <span style={{ width: 28, height: 28 }}>{ICONS.calendar}</span>
          </div>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Archive · empty</div>
          <div style={{
            fontFamily: C3.display, fontSize: 26, color: C3.ink,
            lineHeight: 1.1, marginTop: 8, letterSpacing: -0.3, textWrap: 'pretty',
          }}>No finished matches.</div>
          <div style={{
            fontFamily: C3.sans, fontSize: 13, color: C3.ink70,
            marginTop: 8, lineHeight: 1.5, textWrap: 'pretty', maxWidth: 280,
            margin: '8px auto 0',
          }}>
            Once the first fixture wraps up, its stub will appear here — with
            your prediction and everyone else's right next to the result.
          </div>
          <div style={{ marginTop: 18 }}>
            <TKButton variant="secondary" size="sm" trailing="→">
              See upcoming matches
            </TKButton>
          </div>
        </div>
      </div>
    </FinishedShell>
  );
}

Object.assign(window, {
  PredictionChip, FinishedCard,
  FinishedShell, FinishedMatchesScreen, FinishedLoading, FinishedEmpty,
});
