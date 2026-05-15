// Prediction detail screen — the screen reached when a Predict CTA is tapped
// from the home list, or when a user revisits any locked match to see
// everyone's picks.
//
// Composition:
//   ┌─ BackHeader (title "Prediction", optional lock icon trailing)
//   ├─ MatchHeadline (date / venue / large flags / VS or score)
//   ├─ OutcomeSelector (group: 1·X·2 or knockout: 1·X1·X2·2; cells can be
//   │                   unselected / selected / disabled-locked)
//   ├─ SubmitButton (disabled / save / saving / saved / locked banner)
//   └─ EveryonePredictions (avatar · name · outcome chip · you-highlight)
//
// 9 artboard variants:
//   1. Group · nothing selected (Save disabled)
//   2. Group · 1 selected (Save enabled)
//   3. Group · X re-selected (Save dirty)
//   4. Group · saving spinner
//   5. Group · saved success
//   6. Group · "Moving on…" auto-advance
//   7. Knockout · X1 selected (4 cells)
//   8. Locked · you predicted 1
//   9. Locked · you predicted nothing
//   10. Loading skeleton
//   11. Match not found

// ─────────────────────────── MATCH HEADLINE ───────────────────────────

// Full-width matchup card used at the top of the detail screen. No
// perforation here — it's a single piece of "paper" stuck to the screen.
function MatchHeadline({ m, state = 'open' }) {
  const isLive = state === 'live';
  const isLocked = state === 'locked' || isLive;
  const showScore = (isLive || isLocked) && m.score;

  return (
    <div style={{
      margin: '0 16px 18px',
      borderRadius: 16,
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Strip: stage + date + venue + (live badge) */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: `1px dashed ${C3.ink20}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700 }}>
            ★ {m.stage || 'Group Stage'}
          </div>
          <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
            letterSpacing: 0.6, marginTop: 4,
            fontVariantNumeric: 'tabular-nums' }}>
            {m.dayLong} · {m.time24} · {m.venue}, {m.city}
          </div>
        </div>
        {isLive && <LiveBadge minute={m.score.minute} />}
      </div>

      {/* Matchup */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 10, padding: '18px 14px 16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <FlagSquare code={m.home.code} size={68} radius={5} />
          <div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>{m.home.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 18, color: C3.ink,
              lineHeight: 1.1, marginTop: 3, textWrap: 'pretty', maxWidth: 110 }}>
              {m.home.name}
            </div>
          </div>
        </div>

        {showScore ? (
          <div style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4 }}>
            <div style={{
              fontFamily: C3.display, fontSize: 38, color: C3.ink,
              lineHeight: 1, letterSpacing: -1,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span>{m.score.home}</span>
              <span style={{ color: C3.ink50, fontSize: 20 }}>:</span>
              <span>{m.score.away}</span>
            </div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {isLive ? m.score.minute : 'Full time'}
            </div>
          </div>
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `1.5px solid ${C3.ink}`, color: C3.ink,
            display: 'grid', placeItems: 'center',
            fontFamily: C3.display, fontSize: 16, letterSpacing: 0.5,
            background: C3.ticket,
          }}>vs</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <FlagSquare code={m.away.code} size={68} radius={5} />
          <div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>{m.away.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 18, color: C3.ink,
              lineHeight: 1.1, marginTop: 3, textWrap: 'pretty', maxWidth: 110 }}>
              {m.away.name}
            </div>
          </div>
        </div>
      </div>

      {/* Owners footer */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        fontFamily: C3.mono, fontSize: 10, color: C3.ink70, letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}>
        <span><span style={{ color: C3.ink50 }}>Player</span>{' '}{m.home.owner}</span>
        <span style={{ color: C3.ink50 }}>·</span>
        <span><span style={{ color: C3.ink50 }}>Player</span>{' '}{m.away.owner}</span>
      </div>
    </div>
  );
}

// ─────────────────────────── OUTCOME SELECTOR ───────────────────────────

// Single segmented cell.
// kind: 'home' | 'draw' | 'away'   — drives the value label (1 / X / 2)
// state: 'unselected' | 'selected' | 'disabled'
// For knockout draws we override the label to X1 (home through) or X2 (away).
function OutcomeCell({ value, label, hint, state = 'unselected', wide }) {
  const isSelected = state === 'selected';
  const isDisabled = state === 'disabled';
  const bg = isSelected ? C3.ink : (isDisabled ? 'transparent' : C3.ticket);
  const fg = isSelected ? C3.ticket : (isDisabled ? C3.ink50 : C3.ink);
  const border = isDisabled
    ? `1.5px dashed ${C3.ink20}`
    : `1.5px solid ${isSelected ? C3.ink : C3.ink20}`;
  return (
    <button style={{
      flex: wide ? '1 1 0' : '1 1 0', minWidth: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 4,
      padding: '14px 8px', borderRadius: 6, border, background: bg, color: fg,
      fontFamily: C3.sans, cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'transform 120ms',
      transform: isSelected ? 'translateY(-1px)' : 'none',
      boxShadow: isSelected ? '0 6px 14px rgba(15,58,53,0.20)' : 'none',
      position: 'relative',
    }}>
      <span style={{
        fontFamily: C3.display, fontSize: 26, lineHeight: 1, letterSpacing: 0.4,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      <span style={{
        fontFamily: C3.mono, fontSize: 9, letterSpacing: 1.4,
        textTransform: 'uppercase', fontWeight: 600,
        color: isSelected ? 'rgba(246,239,219,0.7)' : (isDisabled ? C3.ink50 : C3.ink70),
      }}>{label}</span>
      {hint && (
        <span style={{
          fontFamily: C3.mono, fontSize: 8, letterSpacing: 0.6,
          textTransform: 'uppercase', marginTop: 1,
          color: isSelected ? 'rgba(246,239,219,0.55)' : C3.ink50,
        }}>{hint}</span>
      )}
      {isSelected && (
        <span style={{
          position: 'absolute', top: -8, right: -8,
          width: 20, height: 20, borderRadius: '50%',
          background: C3.stamp, color: C3.ticket,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 12, height: 12 }}>{ICONS.check}</span>
        </span>
      )}
    </button>
  );
}

// kind: 'group' (1·X·2) | 'knockout' (1·X1·X2·2)
// selected: '1' | 'X' | 'X1' | 'X2' | '2' | null
// disabled: when true, all cells render as disabled
function OutcomeSelector({ kind = 'group', selected = null, disabled = false, eyebrow }) {
  const cellState = (v) => {
    if (disabled) return 'disabled';
    return selected === v ? 'selected' : 'unselected';
  };
  return (
    <div style={{ padding: '0 16px 18px', fontFamily: C3.sans }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
        }}>
          {eyebrow || (kind === 'knockout' ? 'Pick the winner' : 'Pick the outcome')}
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>
          {kind === 'knockout' ? '4 options · knockout' : '3 options · group'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <OutcomeCell value="1"  label="Home"      state={cellState('1')}  />
        {kind === 'group' && (
          <OutcomeCell value="X" label="Draw" state={cellState('X')} />
        )}
        {kind === 'knockout' && (
          <React.Fragment>
            <OutcomeCell value="X1" label="Draw" hint="Home through" state={cellState('X1')} />
            <OutcomeCell value="X2" label="Draw" hint="Away through" state={cellState('X2')} />
          </React.Fragment>
        )}
        <OutcomeCell value="2"  label="Away"      state={cellState('2')}  />
      </div>
      {disabled && (
        <div style={{
          marginTop: 10, fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center',
        }}>
          Locked at kick-off · no further edits
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── SUBMIT BUTTON ROW ───────────────────────────

// state:
//   'disabled' (no change)  ·  'idle' (save enabled)  ·  'saving'
//   'success'  · 'success-advance' (saved, moving on…)
function SubmitRow({ state = 'idle' }) {
  const labels = {
    disabled: 'Save Prediction',
    idle:     'Save Prediction',
    saving:   'Saving…',
    success:  'Prediction saved',
    'success-advance': 'Saved · Moving on…',
  };
  const buttonState =
    state === 'disabled' ? 'disabled' :
    state === 'saving'   ? 'loading' :
    (state === 'success' || state === 'success-advance') ? 'success' :
    'idle';

  return (
    <div style={{ padding: '0 16px 20px' }}>
      <TKButton
        variant="primary" size="lg" block
        state={buttonState}
        trailing={buttonState === 'idle' ? '→' : null}
      >
        {labels[state]}
      </TKButton>
      {state === 'success-advance' && (
        <div style={{
          marginTop: 10, fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center',
        }}>
          Next match · in 2s
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── LOCKED ROW ───────────────────────────

// Replaces SubmitRow once the match has kicked off.
function LockedRow({ predicted }) {
  return (
    <div style={{ padding: '0 16px 22px' }}>
      <div style={{
        padding: '14px 14px',
        border: `1.5px dashed ${C3.ink20}`,
        borderRadius: 8, background: C3.ticket,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(15,58,53,0.06)', color: C3.ink,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{ width: 18, height: 18 }}>{ICONS.lock}</span>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
          }}>Predictions locked</div>
          <div style={{
            fontFamily: C3.display, fontSize: 17, color: C3.ink,
            lineHeight: 1.15, marginTop: 2,
          }}>
            {predicted
              ? <>You predicted <span style={{ color: C3.stamp }}>{predicted}</span> · Locked</>
              : <>No prediction · Locked</>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── EVERYONE'S PREDICTIONS ───────────────────────────

// Outcome chip used in the player list.
function OutcomeChip({ value, tone = 'default' }) {
  if (value == null) {
    return (
      <span style={{
        display: 'inline-grid', placeItems: 'center',
        width: 36, height: 28, borderRadius: 4,
        border: `1.5px dashed ${C3.ink20}`, color: C3.ink50,
        fontFamily: C3.mono, fontSize: 10, letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}>—</span>
    );
  }
  const styles = {
    default: { bg: 'transparent', fg: C3.ink,    bd: C3.ink20  },
    you:     { bg: C3.ink,        fg: C3.ticket, bd: C3.ink    },
    correct: { bg: 'rgba(31,106,77,0.10)', fg: '#1f6a4d', bd: '#1f6a4d' },
    wrong:   { bg: 'transparent', fg: C3.stamp,  bd: C3.stamp  },
  }[tone];
  return (
    <span style={{
      display: 'inline-grid', placeItems: 'center',
      minWidth: 36, height: 28, padding: '0 7px', borderRadius: 4,
      border: `1.5px solid ${styles.bd}`, background: styles.bg, color: styles.fg,
      fontFamily: C3.display, fontSize: 16, letterSpacing: 0.4,
      fontVariantNumeric: 'tabular-nums',
    }}>{value}</span>
  );
}

function EveryonePredictions({ roster = PLAYER_ROSTER, locked = false, hiddenForYou }) {
  // hiddenForYou: when true, your row shows "Hidden until kick-off" to
  // prevent influencing others — but the brief says picks are public, so
  // default is to reveal.
  return (
    <div style={{ margin: '0 16px 18px', fontFamily: C3.sans }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 2px 8px',
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
        }}>
          ★ Everyone's predictions
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>
          {roster.filter(p => p.pick).length} / {roster.length} in
        </div>
      </div>
      <div style={{
        borderRadius: 12, ...paperTexture(C3.ticket),
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 6px 16px rgba(50,30,10,0.06)',
        overflow: 'hidden',
      }}>
        {roster.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px',
            borderBottom: i < roster.length - 1 ? `1px dashed ${C3.ink20}` : 'none',
            background: p.you ? 'rgba(168,57,43,0.05)' : 'transparent',
          }}>
            <TKAvatar
              kind={p.kind}
              initial={p.initial}
              emoji={p.emoji}
              size={32}
              ring={p.you ? C3.stamp : undefined}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: C3.display, fontSize: 15,
                color: p.you ? C3.stamp : C3.ink,
                lineHeight: 1, letterSpacing: -0.1,
              }}>{p.name}</div>
              <div style={{
                fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                letterSpacing: 1, marginTop: 3, textTransform: 'uppercase',
              }}>
                {p.you && hiddenForYou
                  ? 'Hidden · only you see'
                  : (p.pick ? 'Submitted' : 'No prediction yet')}
              </div>
            </div>
            <OutcomeChip
              value={p.you && hiddenForYou ? '·' : p.pick}
              tone={p.you ? 'you' : 'default'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── SHELL HELPER ───────────────────────────

function DetailShell({ children, lockIcon, title = 'Prediction', eyebrow }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader
          title={title}
          eyebrow={eyebrow || 'Match ticket'}
          statusIcon={lockIcon ? 'lock' : null}
        />
        {children}
      </div>
      <BottomNav variant="live" activeId="predictions" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── PREDICTION DETAIL VARIANTS ───────────────────────────

// 1. Group · nothing selected — Save disabled
function PredictionGroupBlank() {
  return (
    <DetailShell eyebrow="Match ticket · #002">
      <MatchHeadline m={MATCHES[1]} />
      <OutcomeSelector kind="group" selected={null} />
      <SubmitRow state="disabled" />
      <EveryonePredictions />
    </DetailShell>
  );
}

// 2. Group · 1 selected — Save enabled
function PredictionGroupSelected() {
  return (
    <DetailShell eyebrow="Match ticket · #002">
      <MatchHeadline m={MATCHES[1]} />
      <OutcomeSelector kind="group" selected="1" />
      <SubmitRow state="idle" />
      <EveryonePredictions roster={PLAYER_ROSTER.map(p =>
        p.you ? { ...p, pick: '1' } : p)} />
    </DetailShell>
  );
}

// 3. Group · X selected after edit
function PredictionGroupDraw() {
  return (
    <DetailShell eyebrow="Match ticket · #002">
      <MatchHeadline m={MATCHES[1]} />
      <OutcomeSelector kind="group" selected="X" />
      <SubmitRow state="idle" />
      <EveryonePredictions roster={PLAYER_ROSTER.map(p =>
        p.you ? { ...p, pick: 'X' } : p)} />
    </DetailShell>
  );
}

// 4. Saving spinner
function PredictionSaving() {
  return (
    <DetailShell eyebrow="Match ticket · #002">
      <MatchHeadline m={MATCHES[1]} />
      <OutcomeSelector kind="group" selected="1" />
      <SubmitRow state="saving" />
      <EveryonePredictions roster={PLAYER_ROSTER.map(p =>
        p.you ? { ...p, pick: '1' } : p)} />
    </DetailShell>
  );
}

// 5. Saved — success flash
function PredictionSaved() {
  return (
    <DetailShell eyebrow="Match ticket · #002">
      <MatchHeadline m={MATCHES[1]} />
      <OutcomeSelector kind="group" selected="1" />
      <SubmitRow state="success" />
      <EveryonePredictions roster={PLAYER_ROSTER.map(p =>
        p.you ? { ...p, pick: '1' } : p)} />
    </DetailShell>
  );
}

// 6. Saved · Moving on… (auto-advance hint)
function PredictionSavedAdvance() {
  return (
    <DetailShell eyebrow="Match ticket · #002">
      <MatchHeadline m={MATCHES[1]} />
      <OutcomeSelector kind="group" selected="1" />
      <SubmitRow state="success-advance" />
      <EveryonePredictions roster={PLAYER_ROSTER.map(p =>
        p.you ? { ...p, pick: '1' } : p)} />
    </DetailShell>
  );
}

// 7. Knockout · X1 selected
function PredictionKnockout() {
  // Build a synthetic knockout match (re-use existing flags / owners).
  const ko = {
    ...MATCHES[2],
    stage: 'Round of 16 · Match A',
    dayLong: 'Sunday, Jun 29', dayShort: 'Sun, Jun 29',
    venue: 'Mercedes-Benz Stadium', city: 'Atlanta',
  };
  return (
    <DetailShell eyebrow="Match ticket · #045" title="Prediction · Knockout">
      <MatchHeadline m={ko} />
      <OutcomeSelector kind="knockout" selected="X1" />
      <SubmitRow state="idle" />
      <EveryonePredictions roster={[
        { name: 'Darko (you)', kind: 'initials', initial: 'D', pick: 'X1', you: true },
        { name: 'Ana',         kind: 'emoji',    emoji: '🦊',  pick: '1' },
        { name: 'Marko',       kind: 'initials', initial: 'M', pick: '2' },
        { name: 'Petra',       kind: 'emoji',    emoji: '🐺',  pick: 'X1' },
        { name: 'Ivan',        kind: 'initials', initial: 'I', pick: 'X2' },
        { name: 'Lena',        kind: 'emoji',    emoji: '🦁',  pick: '1' },
        { name: 'Mira',        kind: 'photo',    initial: 'M', pick: null },
      ]} />
    </DetailShell>
  );
}

// 8. Locked · you predicted 1
function PredictionLockedWithPick() {
  return (
    <DetailShell eyebrow="Match ticket · #016" lockIcon>
      <MatchHeadline m={MATCH_LOCKED_PRED} state="locked" />
      <OutcomeSelector kind="group" selected="1" disabled />
      <LockedRow predicted="1" />
      <EveryonePredictions roster={[
        { name: 'Darko (you)', kind: 'initials', initial: 'D', pick: '1', you: true },
        { name: 'Ana',         kind: 'emoji',    emoji: '🦊',  pick: 'X' },
        { name: 'Marko',       kind: 'initials', initial: 'M', pick: '1' },
        { name: 'Petra',       kind: 'emoji',    emoji: '🐺',  pick: '2' },
        { name: 'Ivan',        kind: 'initials', initial: 'I', pick: '1' },
        { name: 'Lena',        kind: 'emoji',    emoji: '🦁',  pick: 'X' },
        { name: 'Mira',        kind: 'photo',    initial: 'M', pick: '2' },
      ]} locked />
    </DetailShell>
  );
}

// 9. Locked · no prediction
function PredictionLockedNoPick() {
  return (
    <DetailShell eyebrow="Match ticket · #017" lockIcon>
      <MatchHeadline m={MATCH_LOCKED_NONE} state="locked" />
      <OutcomeSelector kind="group" selected={null} disabled />
      <LockedRow />
      <EveryonePredictions roster={[
        { name: 'Darko (you)', kind: 'initials', initial: 'D', pick: null, you: true },
        { name: 'Ana',         kind: 'emoji',    emoji: '🦊',  pick: '1' },
        { name: 'Marko',       kind: 'initials', initial: 'M', pick: 'X' },
        { name: 'Petra',       kind: 'emoji',    emoji: '🐺',  pick: '1' },
        { name: 'Ivan',        kind: 'initials', initial: 'I', pick: '2' },
        { name: 'Lena',        kind: 'emoji',    emoji: '🦁',  pick: '1' },
        { name: 'Mira',        kind: 'photo',    initial: 'M', pick: 'X' },
      ]} locked />
    </DetailShell>
  );
}

// 10. Loading skeleton
function PredictionLoading() {
  const bar = (w, h = 12) => (
    <span style={{
      display: 'inline-block', width: w, height: h, borderRadius: 2,
      background: 'rgba(15,58,53,0.08)',
    }} />
  );
  return (
    <DetailShell>
      <div style={{ padding: '0 16px 18px', animation: 'tkPulse 1.6s ease-in-out infinite' }}>
        <TKSkeletonTicket />
      </div>
      <div style={{ padding: '0 16px 18px', animation: 'tkPulse 1.6s ease-in-out infinite' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          {bar(110, 10)} {bar(80, 9)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3].map(i => (
            <span key={i} style={{
              flex: 1, height: 78, borderRadius: 6,
              background: 'rgba(15,58,53,0.08)',
            }} />
          ))}
        </div>
      </div>
      <div style={{ padding: '0 16px 18px', animation: 'tkPulse 1.6s ease-in-out infinite' }}>
        <span style={{ display: 'block', height: 48, borderRadius: 4,
          background: 'rgba(15,58,53,0.08)' }} />
      </div>
      <div style={{ padding: '0 16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        animation: 'tkPulse 1.6s ease-in-out infinite' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(15,58,53,0.04)',
          }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(15,58,53,0.08)' }} />
            <span style={{ flex: 1 }}>{bar(120, 12)}</span>
            <span style={{ width: 36, height: 28, borderRadius: 4,
              background: 'rgba(15,58,53,0.08)' }} />
          </div>
        ))}
      </div>
    </DetailShell>
  );
}

// 11. Match not found
function PredictionNotFound() {
  return (
    <DetailShell eyebrow="Lookup failed">
      <div style={{ padding: '36px 20px' }}>
        <div style={{
          ...paperTexture(C3.ticket),
          borderRadius: 14, padding: '28px 22px',
          boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
          textAlign: 'center',
        }}>
          <div style={{
            margin: '0 auto 14px', width: 64, height: 64, borderRadius: '50%',
            border: `2px dashed ${C3.ink20}`, color: C3.ink50,
            display: 'grid', placeItems: 'center',
            fontFamily: C3.display, fontSize: 30, lineHeight: 1,
          }}>?</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ 404 · void ticket</div>
          <div style={{
            fontFamily: C3.display, fontSize: 24, color: C3.ink,
            lineHeight: 1.1, marginTop: 8, letterSpacing: -0.3, textWrap: 'pretty',
          }}>Match not found.</div>
          <div style={{
            fontFamily: C3.sans, fontSize: 13, color: C3.ink70,
            marginTop: 8, lineHeight: 1.5, textWrap: 'pretty',
          }}>
            This fixture isn't in the pool's schedule. The link may be old, or
            the match has been removed.
          </div>
          <div style={{ marginTop: 18,
            display: 'flex', justifyContent: 'center', gap: 8 }}>
            <TKButton variant="secondary" size="sm">Back to home</TKButton>
            <TKButton variant="primary" size="sm" trailing="→">Schedule</TKButton>
          </div>
        </div>
      </div>
    </DetailShell>
  );
}

Object.assign(window, {
  MatchHeadline, OutcomeCell, OutcomeSelector, OutcomeChip,
  SubmitRow, LockedRow, EveryonePredictions, DetailShell,
  PredictionGroupBlank, PredictionGroupSelected, PredictionGroupDraw,
  PredictionSaving, PredictionSaved, PredictionSavedAdvance,
  PredictionKnockout, PredictionLockedWithPick, PredictionLockedNoPick,
  PredictionLoading, PredictionNotFound,
});
