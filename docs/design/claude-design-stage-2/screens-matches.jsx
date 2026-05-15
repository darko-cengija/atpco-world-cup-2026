// Home — Upcoming Matches.
// One MatchTicket component that handles every state the brief calls for:
//   • upcoming · no prediction         → primary "Predict" CTA
//   • upcoming · already predicted     → "Predicted · X" stamp + Edit
//   • live · in progress               → score, LIVE pulse, minute
//   • locked · with prediction         → "You predicted X · Locked"
//   • locked · no prediction           → "No prediction · Locked"
//
// Plus the home shell with 4 list-level states: default, loading, error,
// empty.  The "Finished Matches" link sits at the bottom of the scroll.

// ─────────────────────────── small atoms ───────────────────────────

// Two paper-coloured disks + dashed line — the ticket's perforation.
function Perforation({ paper = C3.paper, inset = 14 }) {
  return (
    <div style={{ position: 'relative', height: 0 }}>
      <div style={{ position: 'absolute', left: -10, top: -10,
        width: 20, height: 20, borderRadius: '50%', background: paper }} />
      <div style={{ position: 'absolute', right: -10, top: -10,
        width: 20, height: 20, borderRadius: '50%', background: paper }} />
      <div style={{ position: 'absolute', left: inset, right: inset, top: -1,
        borderTop: `1.5px dashed ${C3.ink20}` }} />
    </div>
  );
}

// Outcome stamp — rotated, outlined, stamp-red. Used in ticket footers
// and in the Everyone's Predictions list.
function OutcomeStamp({ value, tone = 'stamp', rotate = -3, size = 'md' }) {
  const colors = {
    stamp:    { fg: C3.stamp, bg: 'transparent' },
    ink:      { fg: C3.ink,   bg: 'transparent' },
    success:  { fg: '#1f6a4d',bg: 'transparent' },
    muted:    { fg: C3.ink50, bg: 'transparent' },
  }[tone];
  const dims = size === 'sm'
    ? { pad: '3px 7px', fs: 11, bw: 1.5, ls: 1 }
    : { pad: '6px 10px', fs: 14, bw: 2, ls: 1 };
  return (
    <span style={{
      display: 'inline-block',
      padding: dims.pad,
      border: `${dims.bw}px solid ${colors.fg}`,
      color: colors.fg, background: colors.bg,
      transform: `rotate(${rotate}deg)`,
      fontFamily: C3.display, fontSize: dims.fs, letterSpacing: dims.ls,
      textTransform: 'uppercase', borderRadius: 3,
      fontVariantNumeric: 'tabular-nums',
    }}>{value}</span>
  );
}

// Pulsing red dot. Used by LiveBadge. CSS keyframe tkPulse is registered in
// the host HTML.
function LiveDot() {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: C3.stamp, display: 'inline-block',
      animation: 'tkPulse 1.4s ease-in-out infinite',
      boxShadow: `0 0 0 3px rgba(168,57,43,0.18)`,
    }} />
  );
}

function LiveBadge({ minute }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 4,
      background: 'rgba(168,57,43,0.10)',
      border: `1px solid ${C3.stamp}`, color: C3.stamp,
      fontFamily: C3.mono, fontSize: 9, fontWeight: 700,
      letterSpacing: 1.4, textTransform: 'uppercase',
    }}>
      <LiveDot />
      Live · {minute}
    </span>
  );
}

// Stamped lock pill — "Locked" with a tiny lock glyph.
function LockedPill({ label = 'Locked' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 8px', borderRadius: 4,
      background: 'rgba(15,58,53,0.06)', color: C3.ink70,
      fontFamily: C3.mono, fontSize: 9, fontWeight: 700,
      letterSpacing: 1.4, textTransform: 'uppercase',
    }}>
      <span style={{ width: 11, height: 11 }}>{ICONS.lock}</span>
      {label}
    </span>
  );
}

// ─────────────────────────── MATCH TICKET ───────────────────────────

// state:
//   'open'    — upcoming, can still predict
//   'live'    — kicked off, score visible, predictions locked
//   'locked'  — kicked off / past kick-off, no score yet (rare) or final score
function MatchTicket({ m, state = 'open' }) {
  const predicted = m.predicted != null;
  const isLive = state === 'live';
  const isLocked = state === 'locked' || isLive;

  return (
    <div style={{
      margin: '0 16px 16px',
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Top strip: kick-off / venue (+ LIVE badge when applicable) */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: `1px solid ${C3.ink20}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, position: 'relative',
      }}>
        <div>
          <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
            letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {isLive ? 'In play' : 'Kick-off'}
          </div>
          <div style={{ fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1, marginTop: 2 }}>
            {m.dayShort.split(', ')[1]}
          </div>
          <div style={{ fontFamily: C3.mono, fontSize: 12, color: C3.ink,
            letterSpacing: 0.5, marginTop: 3,
            fontVariantNumeric: 'tabular-nums' }}>
            {m.time24} · {m.dayShort.split(', ')[0]}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex',
          flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {isLive ? <LiveBadge minute={m.score.minute} /> : (
            <div>
              <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
                letterSpacing: 1.2, textTransform: 'uppercase' }}>Venue</div>
              <div style={{ fontFamily: C3.sans, fontSize: 13, color: C3.ink,
                fontWeight: 600, marginTop: 4, lineHeight: 1.15, maxWidth: 150 }}>
                {m.venue}
              </div>
              <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
                marginTop: 2, letterSpacing: 0.5 }}>{m.city.toUpperCase()}</div>
            </div>
          )}
          {isLive && (
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>
              {m.venue} · {m.city}
            </div>
          )}
        </div>
      </div>

      <Perforation />

      {/* Matchup */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 6, padding: '20px 16px 14px',
      }}>
        {/* HOME */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FlagSquare code={m.home.code} size={52} radius={4} />
          <div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>Home · {m.home.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 19, color: C3.ink,
              lineHeight: 1.05, letterSpacing: -0.2, marginTop: 2, textWrap: 'pretty' }}>
              {m.home.name}
            </div>
            {m.home.owner && (
              <div style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink70,
                marginTop: 4, fontWeight: 500 }}>
                <span style={{ color: C3.ink50 }}>player</span> {m.home.owner}
              </div>
            )}
          </div>
        </div>

        {/* CENTER — VS or score */}
        {isLive || (isLocked && m.score) ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <div style={{
              fontFamily: C3.display, fontSize: 32, color: C3.ink,
              lineHeight: 1, letterSpacing: -1,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>{m.score.home}</span>
              <span style={{ color: C3.ink50, fontSize: 18 }}>:</span>
              <span>{m.score.away}</span>
            </div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {isLive ? m.score.minute : 'Full time'}
            </div>
          </div>
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1.5px solid ${C3.ink}`, color: C3.ink,
            display: 'grid', placeItems: 'center',
            fontFamily: C3.display, fontSize: 14, letterSpacing: 0.5,
            background: C3.ticket,
          }}>vs</div>
        )}

        {/* AWAY */}
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', textAlign: 'right', gap: 8 }}>
          <FlagSquare code={m.away.code} size={52} radius={4} />
          <div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>Away · {m.away.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 19, color: C3.ink,
              lineHeight: 1.05, letterSpacing: -0.2, marginTop: 2, textWrap: 'pretty' }}>
              {m.away.name}
            </div>
            {m.away.owner && (
              <div style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink70,
                marginTop: 4, fontWeight: 500 }}>
                <span style={{ color: C3.ink50 }}>player</span> {m.away.owner}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer — varies by state */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, minHeight: 56,
      }}>
        <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase', lineHeight: 1.5 }}>
          Match #{String(m.id).padStart(3,'0')}<br/>
          <span style={{ color: C3.ink70 }}>Code {m.home.short}-{m.away.short}</span>
        </div>

        {/* OPEN · no prediction → primary CTA */}
        {state === 'open' && !predicted && (
          <TKButton variant="primary" size="md" trailing="→">Predict</TKButton>
        )}

        {/* OPEN · already predicted → stamp + Edit */}
        {state === 'open' && predicted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <OutcomeStamp value={`Predicted · ${m.predicted}`} rotate={-3} />
            <TKButton variant="secondary" size="sm">Edit</TKButton>
          </div>
        )}

        {/* LIVE / LOCKED · with prediction */}
        {isLocked && predicted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: C3.mono, fontSize: 10, color: C3.ink,
              letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600,
              textAlign: 'right', lineHeight: 1.3,
            }}>
              <span style={{ color: C3.ink50 }}>You predicted</span>
              <br/>
              <span style={{ fontSize: 14 }}>{m.predicted}</span>
            </span>
            <LockedPill />
          </div>
        )}

        {/* LIVE / LOCKED · no prediction */}
        {isLocked && !predicted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
              letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600,
              textAlign: 'right', lineHeight: 1.3,
            }}>
              No prediction
            </span>
            <LockedPill />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── HERO ───────────────────────────

function UpcomingHero({ subtitle = '3 fixtures', stage = 'Group Stage' }) {
  return (
    <div style={{ padding: '6px 20px 16px' }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>★</span> {stage}
        <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        <span style={{ color: C3.ink50 }}>{subtitle}</span>
      </div>
      <div style={{
        fontFamily: C3.display, fontSize: 42, lineHeight: 1,
        color: C3.ink, letterSpacing: -0.5, textWrap: 'pretty',
      }}>
        Upcoming<br/>matches
      </div>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
        letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 8,
      }}>
        World Cup 26
      </div>
    </div>
  );
}

// Bottom link to Finished Matches (the original ticket concept's link).
function FinishedLink() {
  return (
    <div style={{
      margin: '4px 16px 22px',
      padding: '14px 16px',
      border: `1.5px dashed ${C3.ink20}`,
      borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: C3.sans, color: C3.ink,
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 4,
          border: `2px solid ${C3.gold}`, color: C3.gold,
          display: 'grid', placeItems: 'center',
          fontFamily: C3.display, fontSize: 14,
        }}>✓</div>
        <div>
          <div style={{ fontFamily: C3.display, fontSize: 16,
            color: C3.ink, lineHeight: 1.1 }}>Finished matches</div>
          <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
            letterSpacing: 0.6, marginTop: 2 }}>STUBS · ARCHIVE</div>
        </div>
      </div>
      <span style={{ fontFamily: C3.display, fontSize: 22, color: C3.ink }}>→</span>
    </div>
  );
}

// ─────────────────────────── HOME SCREEN VARIANTS ───────────────────────────

// Default — mixed states (predict, predicted, live, locked-w-pred, locked-no-pred)
function HomeUpcomingMatches() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <UpcomingHero subtitle="5 fixtures" />
        <MatchTicket m={MATCHES[0]} state="open" />
        <MatchTicket m={MATCHES[1]} state="open" />
        <MatchTicket m={MATCH_LIVE} state="live" />
        <MatchTicket m={MATCHES[2]} state="open" />
        <FinishedLink />
      </div>
      <BottomNav variant="live" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Loading — skeleton tickets in place of real cards
function HomeUpcomingLoading() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <UpcomingHero subtitle="Loading…" />
        <div style={{ padding: '0 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TKSkeletonTicket />
          <TKSkeletonTicket />
          <TKSkeletonTicket />
        </div>
      </div>
      <BottomNav variant="live" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Error — banner + a couple of cached tickets greyed out behind it
function HomeUpcomingError() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <UpcomingHero subtitle="Connection issue" />
        <div style={{ padding: '0 16px 18px' }}>
          <TKBanner
            tone="error"
            title="Couldn't load matches"
            body="Upcoming matches could not be loaded. Refresh the page in a minute."
            action="Retry"
          />
        </div>
        <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
          <MatchTicket m={MATCHES[0]} state="open" />
          <MatchTicket m={MATCHES[1]} state="open" />
        </div>
      </div>
      <BottomNav variant="live" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Empty — large dashed paper card; finished link still present below
function HomeUpcomingEmpty() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <UpcomingHero subtitle="None for now" />
        <div style={{ padding: '0 16px 18px' }}>
          <TKEmpty
            title="No upcoming matches."
            body="The next fixtures will appear here as soon as the schedule advances."
          />
        </div>
        <FinishedLink />
      </div>
      <BottomNav variant="live" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  Perforation, OutcomeStamp, LiveBadge, LiveDot, LockedPill,
  MatchTicket, UpcomingHero, FinishedLink,
  HomeUpcomingMatches, HomeUpcomingLoading, HomeUpcomingError, HomeUpcomingEmpty,
});
