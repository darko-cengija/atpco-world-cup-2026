// Standings + Winning Chances screens.
//
// Each screen extends the Match Ticket vocabulary:
//   • Paper boards (cream tickets) hold dense tabular rows.
//   • A perforation strip sits between header and table — every
//     standings card is a tear-off receipt.
//   • Mono numerals · DM Serif Display for the Pts column · stamp-red
//     ring + tinted background for the (you) row.
//   • Top-3 ranks are gold/silver/bronze "stamped" discs (in lieu of
//     emoji medals — keeps the print-shop tone).

// ─────────────────────────── PAPER BOARD ───────────────────────────

// Shared section shell: dashed perforation between header and content
// so the card reads as a single ticket stub.
function PaperBoard({ eyebrow, title, subtitle, action, footer, children, mx = 16, mb = 16 }) {
  return (
    <div style={{
      margin: `0 ${mx}px ${mb}px`,
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      <div style={{
        padding: '14px 16px 13px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div style={{
              fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
              letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
            }}>★ {eyebrow}</div>
          )}
          <div style={{
            fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1.05, letterSpacing: -0.3, marginTop: 3, textWrap: 'pretty',
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
              marginTop: 4, lineHeight: 1.45, textWrap: 'pretty',
            }}>{subtitle}</div>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <Perforation paper={C3.paper} />
      <div style={{ paddingTop: 6 }}>{children}</div>
      {footer && (
        <div style={{
          borderTop: `1px dashed ${C3.ink20}`,
          padding: '10px 16px 12px',
          fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
          letterSpacing: 0.8, lineHeight: 1.55,
        }}>{footer}</div>
      )}
    </div>
  );
}

// ─────────────────────────── RANK MEDAL ───────────────────────────

function MedalRank({ rank, you, size = 22 }) {
  const medals = {
    1: { bg: '#cba14e', fg: '#fff8e6', shadow: 'rgba(120,80,20,0.35)' },
    2: { bg: '#a9a9a9', fg: '#f7f7f7', shadow: 'rgba(60,60,60,0.30)' },
    3: { bg: '#a06640', fg: '#f5ecdc', shadow: 'rgba(90,50,20,0.32)' },
  };
  const m = medals[rank];
  if (m) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: m.bg, color: m.fg,
        display: 'grid', placeItems: 'center',
        fontFamily: C3.display, fontSize: size * 0.6, lineHeight: 1,
        boxShadow: `inset 0 -1px 0 ${m.shadow}, 0 1px 0 rgba(0,0,0,0.08)`,
      }}>{rank}</div>
    );
  }
  return (
    <span style={{
      fontFamily: C3.mono, fontSize: 11,
      color: you ? C3.stamp : C3.ink70,
      fontVariantNumeric: 'tabular-nums', letterSpacing: 0.4, fontWeight: 700,
      display: 'inline-block', width: size, textAlign: 'center', lineHeight: 1,
    }}>{String(rank).padStart(2, '0')}</span>
  );
}

// ─────────────────────────── PLAYER CELL ───────────────────────────

function PlayerCell({ p, you, showFlags = true, dim }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
      <TKAvatar
        kind={p.kind} initial={p.initial} emoji={p.emoji}
        size={26}
        ring={you ? C3.stamp : undefined}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: C3.display, fontSize: 15,
          color: dim ? C3.ink50 : (you ? C3.stamp : C3.ink),
          lineHeight: 1, letterSpacing: -0.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{p.name}{you ? ' (you)' : ''}</div>
        {showFlags && p.teams && (
          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
            {p.teams.map(code => (
              <span key={code} style={{
                width: 16, height: 11, borderRadius: 2, overflow: 'hidden',
                boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
              }}>{FLAGS[code]}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── MAIN STANDINGS TABLE ───────────────────────────
//
// Two responsive forms:
//   • compact (≤ 390)  — hides GF / GA, shows # · Player · Pld · W · D · L · GD · Pts
//   • wide (≥ 480)     — full # · Player · Pld · W · D · L · GF · GA · GD · Pts
// Mono numerals throughout; Pts in DM Serif Display so it pops.

const COL_HEAD_STYLE = {
  fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
  letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
  textAlign: 'center',
};
const NUM_STYLE = {
  fontFamily: C3.mono, fontSize: 12, color: C3.ink70,
  fontVariantNumeric: 'tabular-nums', textAlign: 'center', lineHeight: 1,
};

function gridCols(form) {
  // [rank] [player flex] [Pld W D L] [GF GA] [GD] [Pts]
  if (form === 'wide') {
    return '24px 1fr 22px 22px 22px 22px 24px 24px 28px 36px';
  }
  // compact: drop GF + GA
  return '22px 1fr 20px 20px 20px 20px 28px 36px';
}

function StandingsHeader({ form = 'compact' }) {
  const wide = form === 'wide';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols(form),
      alignItems: 'center', gap: wide ? 6 : 5,
      padding: '0 14px 8px',
      borderBottom: `1px solid ${C3.ink20}`,
    }}>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>#</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left', paddingLeft: 35 }}>Player</span>
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

function StandingsRow({ r, form = 'compact', last }) {
  const wide = form === 'wide';
  const you = r.you;
  const ptsStyle = {
    fontFamily: C3.display, fontSize: 19, color: you ? C3.stamp : C3.ink,
    lineHeight: 1, textAlign: 'right',
    fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
  };
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols(form),
      alignItems: 'center', gap: wide ? 6 : 5,
      padding: '12px 14px',
      borderBottom: last ? 'none' : `1px solid ${C3.ink20}`,
      background: you ? 'rgba(168,57,43,0.07)' : 'transparent',
      position: 'relative', cursor: 'pointer',
    }}>
      {you && (
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: C3.stamp,
        }} />
      )}
      <MedalRank rank={r.rank} you={you} size={r.rank <= 3 ? 22 : 22} />
      <PlayerCell p={r} you={you} />
      <span style={NUM_STYLE}>{r.pld}</span>
      <span style={NUM_STYLE}>{r.w}</span>
      <span style={NUM_STYLE}>{r.d}</span>
      <span style={NUM_STYLE}>{r.l}</span>
      {wide && <span style={NUM_STYLE}>{r.gf}</span>}
      {wide && <span style={NUM_STYLE}>{r.ga}</span>}
      <span style={{
        ...NUM_STYLE,
        color: String(r.gd).startsWith('-') ? C3.stamp : C3.ink70,
        fontWeight: 600,
      }}>{r.gd}</span>
      <span style={ptsStyle}>{r.pts}</span>
    </div>
  );
}

function StandingsTable({ rows, form = 'compact' }) {
  return (
    <div>
      <StandingsHeader form={form} />
      {rows.map((r, i) => (
        <StandingsRow key={r.name} r={r} form={form} last={i === rows.length - 1} />
      ))}
    </div>
  );
}

// Skeleton row used by the loading state.
function StandingsSkeletonRow({ form = 'compact' }) {
  const wide = form === 'wide';
  const numCells = (wide ? 7 : 5);
  const bar = (w, h = 9) => (
    <span style={{
      display: 'inline-block', width: w, height: h, borderRadius: 2,
      background: 'rgba(15,58,53,0.10)',
    }} />
  );
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols(form),
      alignItems: 'center', gap: wide ? 6 : 5,
      padding: '12px 14px', borderBottom: `1px solid ${C3.ink20}`,
    }}>
      {bar(16, 12)}
      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(15,58,53,0.10)' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {bar(72, 11)}
          <span style={{ display: 'flex', gap: 3 }}>{bar(16, 11)}{bar(16, 11)}</span>
        </span>
      </span>
      {Array.from({ length: numCells }).map((_, i) => (
        <span key={i} style={{ display: 'flex', justifyContent: 'center' }}>
          {bar(14, 9)}
        </span>
      ))}
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>{bar(26, 14)}</span>
    </div>
  );
}

// ─────────────────────────── WINNING CHANCES ───────────────────────────
//
// Compact row layout (margin-tight; same paper board container):
//   [rank · player]      [pct bar + %]                 [exp pts]
//
// Bar uses ink fill at 0–100%. (you) gets stamp-red fill so the row pops.

function ChanceBar({ pct, you, dim }) {
  const fill = dim ? C3.ink20 : (you ? C3.stamp : C3.ink);
  return (
    <div style={{
      flex: 1, height: 8, borderRadius: 4,
      background: 'rgba(15,58,53,0.08)',
      position: 'relative', overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgba(15,58,53,0.06)',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.max(2, pct)}%`,
        background: fill, borderRadius: 4,
        backgroundImage: dim ? `repeating-linear-gradient(
          135deg, transparent 0 4px, rgba(255,255,255,0.5) 4px 5px)` : 'none',
        transition: 'width 240ms',
      }} />
    </div>
  );
}

function ChanceRow({ c, rank, last, dim }) {
  const you = c.you;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px 1fr 1.4fr 56px',
      alignItems: 'center', gap: 10,
      padding: '11px 14px',
      borderBottom: last ? 'none' : `1px solid ${C3.ink20}`,
      background: you ? 'rgba(168,57,43,0.07)' : 'transparent',
      position: 'relative',
    }}>
      {you && (
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: C3.stamp,
        }} />
      )}
      <MedalRank rank={rank} you={you} size={20} />
      <PlayerCell p={c} you={you} showFlags={false} dim={dim} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ChanceBar pct={c.pct} you={you} dim={dim} />
        <span style={{
          fontFamily: C3.mono, fontSize: 12,
          color: dim ? C3.ink50 : (you ? C3.stamp : C3.ink),
          fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          letterSpacing: 0.3, minWidth: 30, textAlign: 'right',
        }}>{c.pct}%</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: C3.display, fontSize: 16,
          color: dim ? C3.ink50 : (you ? C3.stamp : C3.ink), lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>{dim ? '—' : c.expPts.toFixed(1)}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
          letterSpacing: 1, marginTop: 3, textTransform: 'uppercase',
        }}>exp pts</div>
      </div>
    </div>
  );
}

function ChancesHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px 1fr 1.4fr 56px',
      alignItems: 'center', gap: 10,
      padding: '0 14px 8px',
      borderBottom: `1px solid ${C3.ink20}`,
    }}>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>#</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>Player</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>Chance</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'right' }}>Exp</span>
    </div>
  );
}

function ChancesTable({ rows, dim }) {
  return (
    <div>
      <ChancesHeader />
      {rows.map((c, i) => (
        <ChanceRow key={c.name} c={c} rank={i + 1}
          last={i === rows.length - 1} dim={dim} />
      ))}
    </div>
  );
}

// Admin-only refresh button. Variants: idle | loading. Toast lives outside.
function RefreshControl({ state = 'idle', lastRun = '14 min ago' }) {
  const label = state === 'loading' ? 'Refreshing' : 'Refresh';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5,
    }}>
      <TKButton variant="secondary" size="sm"
        state={state === 'loading' ? 'loading' : 'idle'}
        icon={state === 'loading' ? null : (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 9a8 8 0 0 1 14-3.5L21 8M20 15a8 8 0 0 1-14 3.5L3 16"
              stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 4v4h-4M3 20v-4h4" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}>
        {label}
      </TKButton>
      <span style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 0.8, textTransform: 'uppercase',
      }}>Admin · {lastRun}</span>
    </div>
  );
}

// ─────────────────────────── MAIN STANDINGS SHELL ───────────────────────────
//
// Each phone variant is one screen. Standings + Chances live in the same
// scroll so users can see both contexts at once.

function StandingsScrollDefault({ form = 'compact', adminState = 'idle' }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />

        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams."
          footer="Tap any row to open that player's detail.">
          <StandingsTable rows={STANDINGS_ROWS} form={form} />
        </PaperBoard>

        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches."
          action={<RefreshControl state={adminState} />}
          footer="10,000 simulated remaining schedules · Recalculated after each match.">
          <ChancesTable rows={CHANCES_ROWS} />
        </PaperBoard>

        <div style={{ height: 12 }} />
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Loading — skeleton standings + a loader card for chances
function StandingsScrollLoading() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <StandingsHeader form="compact" />
          {Array.from({ length: 6 }).map((_, i) => (
            <StandingsSkeletonRow key={i} form="compact" />
          ))}
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches.">
          <div style={{
            padding: '24px 16px', display: 'flex', alignItems: 'center', gap: 12,
            justifyContent: 'center',
          }}>
            <TKSpinner color={C3.ink} size={20} label="Calculating chances" />
          </div>
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Empty — both sections show their respective empty copy
function StandingsScrollEmpty() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Pre-tournament" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <div style={{ padding: '0 14px 18px' }}>
            <TKEmpty
              title="No results yet."
              body="Standings will appear after matches are played."
            />
          </div>
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches.">
          <div style={{ padding: '0 14px 18px' }}>
            <TKEmpty
              title="Not enough data."
              body="Winning chances will appear after the next calculation."
            />
          </div>
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Refreshing — toast pinned above the bottom nav
function StandingsScrollRefreshing() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <StandingsTable rows={STANDINGS_ROWS} form="compact" />
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches."
          action={<RefreshControl state="loading" lastRun="just now" />}>
          <ChancesTable rows={CHANCES_ROWS} dim />
        </PaperBoard>
      </div>
      {/* Toast — floating above nav */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 96,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 30,
      }}>
        <TKToast tone="notice" text="Refreshing chances…" />
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Success toast — after refresh completes
function StandingsScrollRefreshSuccess() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <StandingsTable rows={STANDINGS_ROWS} form="compact" />
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches."
          action={<RefreshControl state="idle" lastRun="just now" />}>
          <ChancesTable rows={CHANCES_ROWS} />
        </PaperBoard>
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 96,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 30,
      }}>
        <TKToast tone="success" text="Winning chances refreshed" />
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Error toast — refresh failed
function StandingsScrollRefreshError() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <StandingsTable rows={STANDINGS_ROWS} form="compact" />
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches."
          action={<RefreshControl state="idle" lastRun="14 min ago" />}>
          <ChancesTable rows={CHANCES_ROWS} />
        </PaperBoard>
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 96,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 30,
      }}>
        <TKToast tone="error" text="Refresh failed · try again" />
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// No-simulation row state — paper card with a dashed inline note.
function ChancesNoSim() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <StandingsTable rows={STANDINGS_ROWS} form="compact" />
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches."
          action={<RefreshControl state="idle" lastRun="never" />}>
          <div style={{ padding: '4px 14px 0' }}>
            <TKBanner
              tone="notice"
              title="Simulation not available yet"
              body="Run the first calculation from the admin panel above to populate this section."
            />
          </div>
          <div style={{ opacity: 0.5, pointerEvents: 'none', marginTop: 8 }}>
            <ChancesTable rows={CHANCES_ROWS} dim />
          </div>
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  PaperBoard, MedalRank, PlayerCell,
  StandingsTable, StandingsHeader, StandingsRow, StandingsSkeletonRow,
  ChanceBar, ChanceRow, ChancesHeader, ChancesTable, RefreshControl,
  StandingsScrollDefault, StandingsScrollLoading, StandingsScrollEmpty,
  StandingsScrollRefreshing, StandingsScrollRefreshSuccess, StandingsScrollRefreshError,
  ChancesNoSim,
  COL_HEAD_STYLE, NUM_STYLE,
});
