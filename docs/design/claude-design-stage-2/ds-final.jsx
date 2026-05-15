// ds-final.jsx — final design-system handoff pass.
// Fills the gaps left by the earlier DS boards: prediction outcome button,
// progress bar, chat bubble + reaction rail, save badge / status pill,
// state-matrix table, responsive breakpoint notes, motion guidance,
// focus/pressed/disabled spec, implementation notes for React/Tailwind/lucide.
//
// Everything here speaks the Match Ticket vocabulary — paper texture,
// dashed tear-lines, ink fills, mono caps metadata, stamp-red accents.
// All components are local (no cross-screen imports), so this file can stand
// alone in the DS canvas.

// ═══════════════════════════════════════════════ COMPONENTS

// ─────────────────────────── Prediction outcome button

function FNOutcomeCell({ value, label, hint, state = 'idle', wide }) {
  const selected = state === 'selected';
  const disabled = state === 'disabled';
  const pressed  = state === 'pressed';
  const border = disabled ? `1.5px dashed ${C3.ink20}` :
                  selected ? `1.5px solid ${C3.ink}`   :
                             `1.5px solid ${C3.ink20}`;
  const bg = selected ? C3.ink : (disabled ? 'transparent' : C3.ticket);
  const fg = selected ? C3.ticket : (disabled ? C3.ink50 : C3.ink);
  return (
    <div style={{
      flex: wide ? 2 : 1, minWidth: 0,
      padding: '12px 8px 11px',
      border, borderRadius: 6, background: bg, color: fg,
      ...(selected ? {} : paperTexture(bg)),
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 2, position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transform: pressed ? 'translateY(1px)' : 'none',
      transition: 'transform 100ms',
    }}>
      <div style={{
        fontFamily: C3.display, fontSize: 22, lineHeight: 1,
        letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{
        fontFamily: C3.mono, fontSize: 8.5,
        letterSpacing: 1.2, textTransform: 'uppercase',
        opacity: selected ? 0.85 : 0.65, fontWeight: 600,
      }}>{label}</div>
      {hint && (
        <div style={{
          fontFamily: C3.mono, fontSize: 7.5, marginTop: 1,
          letterSpacing: 1, textTransform: 'uppercase',
          color: selected ? 'rgba(246,239,219,0.65)' : C3.ink50,
        }}>{hint}</div>
      )}
      {selected && (
        <span style={{
          position: 'absolute', top: -7, right: -7,
          width: 16, height: 16, borderRadius: '50%',
          background: C3.stamp, color: C3.ticket,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 10, height: 10 }}>{ICONS.check}</span>
        </span>
      )}
      {disabled && (
        <span style={{
          position: 'absolute', top: -7, right: -7,
          width: 18, height: 18, borderRadius: '50%',
          background: C3.paper, color: C3.ink70,
          border: `1px dashed ${C3.ink20}`,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 10, height: 10 }}>{ICONS.lock}</span>
        </span>
      )}
    </div>
  );
}

function FNOutcomeRow({ kind = 'group', selected = null, disabled, eyebrow }) {
  const cellState = (v) => {
    if (disabled) return 'disabled';
    return selected === v ? 'selected' : 'idle';
  };
  return (
    <div>
      {eyebrow && (
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
          fontWeight: 600,
        }}>{eyebrow}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <FNOutcomeCell value="1" label="Home" state={cellState('1')} />
        {kind === 'group'    && <FNOutcomeCell value="X"  label="Draw"  state={cellState('X')}  />}
        {kind === 'knockout' && <FNOutcomeCell value="X1" label="Draw" hint="Home through" state={cellState('X1')} />}
        {kind === 'knockout' && <FNOutcomeCell value="X2" label="Draw" hint="Away through" state={cellState('X2')} />}
        <FNOutcomeCell value="2" label="Away" state={cellState('2')} />
      </div>
    </div>
  );
}

// ─────────────────────────── Progress bar

function FNProgress({ pct = 0, label, eyebrow, tone = 'ink' }) {
  const fg = tone === 'stamp' ? C3.stamp : C3.ink;
  return (
    <div>
      {(eyebrow || label) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: 6,
        }}>
          {eyebrow && (
            <span style={{
              fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
            }}>{eyebrow}</span>
          )}
          {label && (
            <span style={{
              fontFamily: C3.mono, fontSize: 10, color: fg,
              letterSpacing: 0.4, fontVariantNumeric: 'tabular-nums', fontWeight: 700,
            }}>{label}</span>
          )}
        </div>
      )}
      <div style={{
        height: 6, borderRadius: 2,
        background: 'rgba(15,58,53,0.10)', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%',
          background: fg, transition: 'width 200ms ease-out',
        }} />
        {/* Ticket-style perforation marks every 25% */}
        {[25, 50, 75].map(t => (
          <span key={t} style={{
            position: 'absolute', top: 0, bottom: 0, left: `${t}%`,
            width: 1, background: C3.paper, opacity: 0.7,
          }} />
        ))}
      </div>
    </div>
  );
}

// Indeterminate variant for unknown-duration syncs (e.g. live match poll)
function FNProgressIndeterminate({ label = 'Syncing live' }) {
  return (
    <div>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
        marginBottom: 6,
      }}>★ {label}</div>
      <div style={{
        height: 6, borderRadius: 2,
        background: 'rgba(15,58,53,0.10)', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          width: '40%', background: C3.stamp,
          animation: 'tkSlide 1.4s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────── Save badge / status pill
// Used inline next to page titles. Carries every save state with no toast.

function FNStatusPill({ state = 'saved', label }) {
  const skin = {
    saved:    { fg: '#1f6a4d', bg: 'rgba(31,106,77,0.10)',  bd: '#1f6a4d33', icon: ICONS.check,   text: 'Saved' },
    saving:   { fg: C3.ink,    bg: 'rgba(15,58,53,0.08)',   bd: C3.ink20,    icon: 'spinner',     text: 'Saving…' },
    error:    { fg: C3.stamp,  bg: 'rgba(168,57,43,0.10)',  bd: '#a8392b33', icon: ICONS.alert,   text: 'Retry' },
    locked:   { fg: C3.ink70,  bg: 'transparent',           bd: C3.ink20,    icon: ICONS.lock,    text: 'Locked',  dashed: true },
    live:     { fg: C3.stamp,  bg: 'rgba(168,57,43,0.10)',  bd: C3.stamp,    icon: 'dot',         text: 'Live' },
    finished: { fg: C3.gold,   bg: 'rgba(179,137,46,0.12)', bd: '#b3892e44', icon: ICONS.check,   text: 'Final' },
    admin:    { fg: C3.gold,   bg: 'transparent',           bd: '#b3892e88', icon: ICONS.star,    text: 'Admin' },
    you:      { fg: C3.stamp,  bg: 'transparent',           bd: C3.stamp,    icon: null,          text: 'You' },
    unread:   { fg: C3.stamp,  bg: C3.stamp,                bd: C3.stamp,    icon: null,          text: '3',     solid: true },
  }[state];
  const display = label || skin.text;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px',
      borderRadius: 100,
      border: `1px ${skin.dashed ? 'dashed' : 'solid'} ${skin.bd}`,
      background: skin.solid ? skin.bg : skin.bg,
      color: skin.solid ? C3.ticket : skin.fg,
      fontFamily: C3.mono, fontSize: 9, fontWeight: 700,
      letterSpacing: 1.4, textTransform: 'uppercase',
      lineHeight: 1.4,
    }}>
      {skin.icon === 'spinner' && (
        <span style={{ width: 10, height: 10, display: 'inline-grid', placeItems: 'center' }}>
          {ICONS.spinner(skin.fg, 10)}
        </span>
      )}
      {skin.icon === 'dot' && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: skin.fg,
          animation: 'tkPulse 1.2s ease-in-out infinite',
        }} />
      )}
      {skin.icon && skin.icon !== 'spinner' && skin.icon !== 'dot' && (
        <span style={{ width: 10, height: 10, display: 'inline-grid', placeItems: 'center' }}>
          {skin.icon}
        </span>
      )}
      <span>{display}</span>
    </span>
  );
}

// ─────────────────────────── Chat bubble (DS condensed)

function FNChatBubble({ mine, author = 'Marko', time = '21:04',
  text = 'MEX 3-0 easy. Azteca crowd will eat them alive.',
  reactions, showHeader = true }) {
  const bubbleBg = mine ? C3.ink : C3.ticket;
  const bubbleFg = mine ? C3.ticket : C3.ink;
  return (
    <div style={{ fontFamily: C3.sans, padding: '4px 0' }}>
      {showHeader && (
        <div style={{
          display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
          alignItems: 'center', gap: 8, paddingLeft: mine ? 0 : 44,
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
          }}>★ {mine ? 'You' : author}</span>
          <span style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            fontVariantNumeric: 'tabular-nums',
          }}>{time}</span>
        </div>
      )}
      <div style={{
        display: 'flex',
        flexDirection: mine ? 'row-reverse' : 'row',
        alignItems: 'flex-end', gap: 8,
      }}>
        {!mine && (
          <div style={{ width: 36, flexShrink: 0 }}>
            <TKAvatar kind="emoji" emoji="🦊" size={32} />
          </div>
        )}
        <div style={{
          maxWidth: '76%',
          padding: '10px 13px',
          background: bubbleBg, color: bubbleFg,
          border: mine ? 'none' : `1px solid ${C3.ink20}`,
          borderRadius: 14,
          borderBottomRightRadius: mine ? 4 : 14,
          borderBottomLeftRadius: !mine ? 4 : 14,
          boxShadow: mine
            ? '0 2px 6px rgba(15,58,53,0.18)'
            : '0 1px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(50,30,10,0.08)',
          ...(mine ? {} : paperTexture(C3.ticket)),
          fontSize: 14, lineHeight: 1.4, textWrap: 'pretty',
        }}>{text}</div>
      </div>
      {reactions && (
        <div style={{
          display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap',
          justifyContent: mine ? 'flex-end' : 'flex-start',
          paddingLeft: mine ? 0 : 44,
        }}>
          {reactions.map((r, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 7px 2px 6px', borderRadius: 100,
              border: r.mine ? `1.5px solid ${C3.stamp}` : `1px solid ${C3.ink20}`,
              background: r.mine ? 'rgba(168,57,43,0.10)' : C3.paper,
              fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
              color: r.mine ? C3.stamp : C3.ink70, letterSpacing: 0.4,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span style={{ fontSize: 12 }}>{r.emoji}</span>
              {r.count > 1 && r.count}
            </span>
          ))}
          <button style={{
            width: 26, height: 22, padding: 0, borderRadius: 100,
            background: 'transparent', color: C3.ink50,
            border: `1px dashed ${C3.ink20}`, cursor: 'pointer',
            fontFamily: C3.mono, fontSize: 11, fontWeight: 600,
          }}>+</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════ BOARDS

function BoardHead({ eyebrow, title }) {
  return (
    <div>
      <div className="board-eyebrow">{eyebrow}</div>
      <div className="board-title">{title}</div>
    </div>
  );
}

// ─────────────────────────── Prediction outcome board

function OutcomeBoard() {
  return (
    <div className="board">
      <BoardHead eyebrow="★ Components · 14" title="Prediction outcome buttons" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        <div>
          <div className="row-label">Group · 1·X·2 — idle</div>
          <FNOutcomeRow kind="group" selected={null} />
        </div>
        <div>
          <div className="row-label">Group · home selected</div>
          <FNOutcomeRow kind="group" selected="1" />
        </div>
        <div>
          <div className="row-label">Group · draw selected</div>
          <FNOutcomeRow kind="group" selected="X" />
        </div>
        <div>
          <div className="row-label">Knockout · 1·X1·X2·2 — away through on draw</div>
          <FNOutcomeRow kind="knockout" selected="X2" />
        </div>
        <div>
          <div className="row-label">Locked · disabled, selection preserved</div>
          <FNOutcomeRow kind="group" selected="1" disabled />
        </div>
      </div>
      <CaptionRow>
        Selected cell: ink fill, mono caps subtitle, stamp-red ✓ disc. Pressed nudges 1px down.
        Knockout adds the X1/X2 pair so a draw guess can also call advancement.
      </CaptionRow>
    </div>
  );
}

// ─────────────────────────── Progress + Save badge board

function ProgressBoard() {
  return (
    <div className="board">
      <BoardHead eyebrow="★ Components · 15" title="Progress · status pills" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        <div>
          <div className="row-label">Determinate · draw round progress</div>
          <FNProgress eyebrow="Round 3 of 8" label="38%" pct={38} />
        </div>
        <div>
          <FNProgress eyebrow="Predictions made" label="11 / 12" pct={91.6} tone="stamp" />
        </div>
        <div>
          <FNProgress eyebrow="Group A · matches played" label="3 / 6" pct={50} />
        </div>
        <div>
          <div className="row-label">Indeterminate · syncing</div>
          <FNProgressIndeterminate label="Syncing live · MEX–RSA" />
        </div>

        <hr className="board-divider" style={{ margin: '4px 0 0' }} />

        <div>
          <div className="row-label">Status pills · inline next to page titles</div>
          <div className="cluster" style={{ gap: 8 }}>
            <FNStatusPill state="saved" />
            <FNStatusPill state="saving" />
            <FNStatusPill state="error" />
            <FNStatusPill state="locked" />
          </div>
        </div>
        <div>
          <div className="row-label">Status pills · contextual</div>
          <div className="cluster" style={{ gap: 8 }}>
            <FNStatusPill state="live" />
            <FNStatusPill state="finished" />
            <FNStatusPill state="admin" />
            <FNStatusPill state="you" />
          </div>
        </div>
        <CaptionRow>
          Save Badge owns every save state — never pair it with a toast.
          Live · Final · Admin · You are inline ownership tags.
        </CaptionRow>
      </div>
    </div>
  );
}

// ─────────────────────────── Chat board

function ChatBoard() {
  return (
    <div className="board paper">
      <BoardHead eyebrow="★ Components · 16" title="Chat bubble · reaction rail" />
      <hr className="board-divider" />
      <div style={{
        flex: 1, overflow: 'auto',
        ...paperTexture(C3.paper),
        margin: '0 -8px',
        padding: '6px 8px',
      }}>
        <FNChatBubble
          mine={false} author="Marko" time="21:04"
          text="MEX 3-0 easy. Azteca crowd will eat them alive."
          reactions={[{ emoji: '🔥', count: 2 }, { emoji: '😂', count: 1, mine: true }]}
        />
        <FNChatBubble
          mine={true} time="21:05"
          text="2-1. Bafana defence has been quietly excellent in qualifiers."
          reactions={[{ emoji: '🤔', count: 1 }]}
        />
        <FNChatBubble
          mine={false} author="Ana" time="21:06"
          text="putting €5 on a Hlongwane goal" showHeader={true}
        />
      </div>
      <CaptionRow>
        Other-author bubbles are cream paper with ticket texture; my bubbles are ink fills.
        Reactions sit below the bubble · stamp-red border for ones I added.
      </CaptionRow>
    </div>
  );
}

// ─────────────────────────── Focus / Pressed / Disabled spec

function InteractionSpecBoard() {
  const row = (label, demo, spec) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14,
      alignItems: 'center', padding: '8px 0',
      borderBottom: `1px dashed ${C3.ink20}`,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {demo}
          <span style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
            letterSpacing: 0.4, lineHeight: 1.45,
          }}>{spec}</span>
        </div>
      </div>
    </div>
  );

  // tiny demo button
  const Demo = ({ state }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 12px', borderRadius: 4,
      background: state === 'idle' ? C3.ink :
                  state === 'pressed' ? '#0a2723' :
                  state === 'disabled' ? C3.ink20 :
                  state === 'focus' ? C3.ink : C3.ink,
      color: state === 'disabled' ? C3.ink50 : C3.ticket,
      boxShadow: state === 'focus' ? `0 0 0 3px rgba(15,58,53,0.18)` : 'none',
      transform: state === 'pressed' ? 'translateY(1px)' : 'none',
      opacity: state === 'disabled' ? 0.9 : 1,
      fontFamily: C3.mono, fontSize: 10, letterSpacing: 1.4,
      textTransform: 'uppercase', fontWeight: 700,
    }}>Predict <span style={{ fontFamily: C3.display, fontSize: 13 }}>→</span></span>
  );

  return (
    <div className="board">
      <BoardHead eyebrow="★ Foundations · 17" title="Focus · pressed · disabled" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {row('Idle',     <Demo state="idle" />,     'Default. Ink fill + ticket text.')}
        {row('Hover',    <Demo state="hover" />,    'Background shifts to #0a2723 — same shape. Pointer only.')}
        {row('Focus',    <Demo state="focus" />,    '3px ring · ink @ 18% alpha. Visible for keyboard nav only (focus-visible).')}
        {row('Pressed',  <Demo state="pressed" />,  'translateY(1px) for tactile push. 100ms cubic-out.')}
        {row('Disabled', <Demo state="disabled" />, 'ink-20 fill, ink-50 text. Cursor not-allowed. Outline buttons switch border to dashed.')}
        <div style={{ height: 8 }} />
        <div className="row-label">Form fields</div>
        <div className="vstack" style={{ gap: 6 }}>
          <span style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink70, letterSpacing: 0.4 }}>
            • focus → 1.5px solid ink border + 3px ring (ink @ 10% alpha)
          </span>
          <span style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink70, letterSpacing: 0.4 }}>
            • error → 1.5px solid stamp + 9px mono caption below
          </span>
          <span style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink70, letterSpacing: 0.4 }}>
            • disabled → 1.5px dashed ink-20 + ink-50 placeholder, no ring
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Motion guidance

function MotionBoard() {
  const motionRows = [
    ['Page transition', '160ms · ease-out', 'opacity 0→1, translateY 6px→0. No horizontal slide.'],
    ['Sheet enter',     '240ms · cubic-out','translateY(100%)→0. Scrim fades 0→0.45 in 200ms.'],
    ['Sheet exit',      '180ms · ease-in',  'Same path, reversed.'],
    ['Modal enter',     '180ms · ease-out', 'opacity 0→1 + scale .96→1.'],
    ['Button press',    '100ms',            'transform translateY(0→1px). No bounce.'],
    ['Toast in/out',    'in 200, out 240',  'translateY 12px→0 + opacity. 3000ms dwell. Stacks bottom-up.'],
    ['Tab switch',      'no motion',        'Nav stamp underline cross-fades 120ms.'],
    ['Skeleton pulse',  '1600ms · linear',  'opacity 1→0.55→1. tkPulse keyframe.'],
    ['Spinner',         '900ms · linear',   '360° rotate. tkSpin keyframe.'],
    ['Prediction stamp','420ms · cubic-out','scale 1.4→1 + opacity 0→1 + rotate -8°→-3°. Plays once on save success.'],
    ['Live dot',        '1200ms · ease-io', 'opacity 1→0.4→1. Stamp red.'],
    ['Drag ghost',      '—',                'scale 1.02 + rotate 0.4°. Drop snap 160ms ease-out.'],
    ['Reduced motion',  '—',                '@media (prefers-reduced-motion) → all transitions 0ms, replace pulse with static state.'],
  ];
  return (
    <div className="board paper">
      <BoardHead eyebrow="★ Foundations · 18" title="Motion & animation" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="tokens-table" style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>What</td>
              <td>Timing</td>
              <td style={{ width: '50%' }}>Spec</td>
            </tr>
            {motionRows.map(([k, t, v], i) => (
              <tr key={i} style={{ borderTop: `1px dashed ${C3.ink20}` }}>
                <td style={{ width: '22%' }}>{k}</td>
                <td style={{ width: '24%', color: C3.ink70 }}>{t}</td>
                <td style={{
                  fontFamily: C3.sans, fontSize: 11, color: C3.ink,
                  letterSpacing: 0, textTransform: 'none', lineHeight: 1.45,
                  padding: '8px 0',
                }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <CaptionRow>
          One easing curve: cubic-bezier(.2,.7,.2,1) “cubic-out”. Linear only for spinners.
          Never bounce, never overshoot — the ticket vocabulary is paper, not rubber.
        </CaptionRow>
      </div>
    </div>
  );
}

// ─────────────────────────── State coverage matrix

function StateMatrixBoard() {
  // Columns are states; rows are components/surfaces.
  // 'X' = state is designed; '·' = inherits parent; '—' = not applicable.
  const STATES = ['load','empty','error','success','disabled','locked','saving','admin','you','live','final','unread','open'];
  const ROWS = [
    ['App shell',          ['·','·','X','·','—','·','·','X','·','·','·','·','—']],
    ['Match card',         ['X','X','X','X','—','X','—','—','—','X','X','—','—']],
    ['Prediction outcome', ['X','—','X','X','X','X','X','—','—','—','—','—','—']],
    ['Save badge',         ['—','—','X','X','—','X','X','—','—','X','X','—','—']],
    ['Standings table',    ['X','X','X','·','—','—','—','—','X','·','·','—','—']],
    ['Player row',         ['X','—','—','·','—','—','—','X','X','—','—','—','—']],
    ['Chat bubble',        ['X','X','X','X','—','—','X','X','X','—','—','X','—']],
    ['Reaction rail',      ['—','X','X','X','—','—','X','—','X','—','—','—','—']],
    ['Composer',           ['—','X','X','X','X','X','X','—','—','—','—','—','—']],
    ['Banner / toast',     ['—','—','X','X','—','—','—','—','—','—','—','—','—']],
    ['Modal',              ['—','—','—','—','—','—','X','—','—','—','—','—','X']],
    ['Bottom sheet',       ['—','—','—','—','—','—','X','—','—','—','—','—','X']],
    ['Form field',         ['—','X','X','X','X','X','X','—','—','—','—','—','—']],
    ['Button',             ['—','—','—','X','X','—','X','—','—','—','—','—','—']],
    ['Team chip',          ['—','—','—','X','X','X','—','—','X','—','—','—','—']],
    ['Bottom nav',         ['·','·','·','·','—','—','—','·','·','·','·','X','—']],
    ['Page header',        ['·','·','·','·','—','X','X','·','·','X','X','—','—']],
    ['Progress bar',       ['X','—','X','X','—','—','X','—','—','X','—','—','—']],
    ['Avatar',             ['—','—','—','—','—','—','—','X','X','—','—','—','—']],
  ];
  const cell = (v) => {
    if (v === 'X') return <span style={{ color: C3.ink, fontWeight: 700 }}>X</span>;
    if (v === '·') return <span style={{ color: C3.ink50 }}>·</span>;
    return <span style={{ color: C3.ink20 }}>—</span>;
  };
  return (
    <div className="board">
      <BoardHead eyebrow="★ Coverage · 19" title="State matrix" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontFamily: C3.mono, fontSize: 9, color: C3.ink,
            letterSpacing: 0.6,
          }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 6px', color: C3.ink50,
                  letterSpacing: 1.4, textTransform: 'uppercase' }}>Component</th>
                {STATES.map(s => (
                  <th key={s} style={{
                    padding: '6px 4px', color: C3.ink50, letterSpacing: 1.2,
                    textTransform: 'uppercase', fontWeight: 600, fontSize: 8.5,
                    textAlign: 'center',
                  }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([name, cells]) => (
                <tr key={name} style={{ borderTop: `1px dashed ${C3.ink20}` }}>
                  <td style={{
                    padding: '7px 6px', fontFamily: C3.sans, fontSize: 11,
                    color: C3.ink, fontWeight: 600,
                  }}>{name}</td>
                  {cells.map((v, i) => (
                    <td key={i} style={{ padding: '7px 4px', textAlign: 'center' }}>
                      {cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CaptionRow style={{ marginTop: 10 }}>
          X = designed in this DS · · = inherits parent state · — = not applicable.
          Every X resolves to a populated artboard in this canvas or the prototype boards.
        </CaptionRow>
      </div>
    </div>
  );
}

// ─────────────────────────── Responsive board

function ResponsiveBoard() {
  const widths = [
    { w: 360, label: 'Narrow', note: 'Older iPhones, Android SE class.' },
    { w: 390, label: 'Default', note: 'iPhone 14/15/16 — design target.' },
    { w: 430, label: 'PWA cap', note: 'Pro Max class. Content stops at 430.' },
    { w: 560, label: 'Wide / landscape', note: 'Phone landscape, foldable cover. Letterboxed.' },
  ];
  return (
    <div className="board paper">
      <BoardHead eyebrow="★ Coverage · 20" title="Responsive breakpoints" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="row-label">Frames</div>
        <div className="cluster" style={{ gap: 16, alignItems: 'flex-end' }}>
          {widths.map(b => (
            <div key={b.w} style={{ textAlign: 'center' }}>
              <div style={{
                width: b.w / 4.2, height: 110,
                ...paperTexture(C3.ticket),
                border: `1.5px solid ${C3.ink}`, borderRadius: 8,
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}>
                <div style={{
                  borderBottom: `1px dashed ${C3.ink20}`,
                  padding: 4,
                  fontFamily: C3.mono, fontSize: 7, color: C3.ink50,
                  letterSpacing: 0.6, textAlign: 'center',
                }}>{b.w}</div>
                <div style={{ flex: 1, padding: 6, display: 'flex',
                  flexDirection: 'column', gap: 4 }}>
                  <span style={{ height: 8, background: 'rgba(15,58,53,0.12)', borderRadius: 1 }} />
                  <span style={{ height: 6, background: 'rgba(15,58,53,0.08)', borderRadius: 1, width: '70%' }} />
                  <span style={{ height: 6, background: 'rgba(15,58,53,0.08)', borderRadius: 1, width: '50%' }} />
                </div>
                <div style={{
                  borderTop: `1px dashed ${C3.ink20}`,
                  padding: 4,
                  fontFamily: C3.mono, fontSize: 7, color: C3.ink50,
                  letterSpacing: 0.6, textAlign: 'center',
                }}>nav</div>
              </div>
              <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
                letterSpacing: 1.2, marginTop: 6, textTransform: 'uppercase', fontWeight: 600 }}>
                {b.w}px · {b.label}
              </div>
            </div>
          ))}
        </div>

        <hr className="board-divider" />

        <table className="tokens-table" style={{ width: '100%' }}>
          <tbody>
            <tr><td>360px</td><td style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink, textTransform: 'none', letterSpacing: 0 }}>
              Match card flag squares 30px → 26px. Nav tab labels stay visible (no icon-only). Match-card subtitle wraps to 2 lines. Standings table drops the “P” column (still implied; shown in tooltip).
            </td></tr>
            <tr><td>390px</td><td style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink, textTransform: 'none', letterSpacing: 0 }}>
              Design target. All padding, type, and grids are calibrated here.
            </td></tr>
            <tr><td>430px</td><td style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink, textTransform: 'none', letterSpacing: 0 }}>
              Content max-width caps at 430. Page background extends edge-to-edge; the ticket column is centered with 16px gutters preserved.
            </td></tr>
            <tr><td>≥560px / landscape</td><td style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink, textTransform: 'none', letterSpacing: 0 }}>
              Letterboxed: kraft-paper bg fills the viewport with the 430-wide column centered. Bottom nav stays anchored to the column, not the viewport, so taps remain reachable. No tablet/desktop layout — this is a phone-first PWA.
            </td></tr>
            <tr><td>Padding base</td><td style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink, textTransform: 'none', letterSpacing: 0 }}>
              16px horizontal gutter at all sizes. Card inner padding 18/14. Nothing shrinks below 12px.
            </td></tr>
            <tr><td>Tap target</td><td style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink, textTransform: 'none', letterSpacing: 0 }}>
              Every interactive element ≥ 44×44px even when its visible chrome is smaller (use ::before to extend hit area).
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────── Implementation notes

function ImplBoard() {
  const Note = ({ heading, children }) => (
    <div>
      <div className="row-label" style={{ color: C3.stamp, letterSpacing: 1.6 }}>
        ★ {heading}
      </div>
      <div style={{
        fontFamily: C3.sans, fontSize: 12, color: C3.ink, lineHeight: 1.5,
        textWrap: 'pretty',
      }}>{children}</div>
    </div>
  );
  const Code = ({ children }) => (
    <code style={{
      fontFamily: C3.mono, fontSize: 10.5,
      background: 'rgba(15,58,53,0.06)',
      padding: '1px 4px', borderRadius: 3, color: C3.ink,
    }}>{children}</code>
  );
  return (
    <div className="board">
      <BoardHead eyebrow="★ Handoff · 21" title="Implementation · React + Tailwind + lucide" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 14 }}>
        <Note heading="Stack">
          React 18 · Tailwind 3.4 · <Code>lucide-react</Code> for icons (24px, stroke 1.6).
          Vite PWA plugin. No CSS-in-JS, no global resets beyond Tailwind preflight.
        </Note>
        <Note heading="Tailwind config — extend, don’t replace">
          Map the tokens 1:1 in <Code>theme.extend</Code>:
          colors <Code>paper</Code> / <Code>ticket</Code> / <Code>ink</Code> (+ /70 /50 /20) / <Code>stamp</Code> / <Code>stamp-ink</Code> / <Code>gold</Code> / <Code>success</Code>.
          Font families <Code>display</Code> (DM Serif Display), <Code>sans</Code> (Inter Tight), <Code>mono</Code> (JetBrains Mono).
          Spacing scale: keep Tailwind defaults; add <Code>tear</Code>: dashed 1.5px border util.
        </Note>
        <Note heading="Type ramp">
          Class presets:
          <Code>.t-display</Code> = font-display text-[42px] leading-none tracking-tight ·
          <Code>.t-h2</Code> = font-display text-[22px] ·
          <Code>.t-h3</Code> = font-display text-[19px] ·
          <Code>.t-body</Code> = font-sans text-[13px] leading-snug ·
          <Code>.t-meta</Code> = font-mono text-[10px] uppercase tracking-[0.14em] ·
          <Code>.t-stamp</Code> = font-mono text-[9px] uppercase tracking-[0.15em] font-bold.
          Always pair tabular numerals with mono (<Code>tabular-nums</Code>).
        </Note>
        <Note heading="Icons (lucide)">
          Use these lucide names verbatim: <Code>ArrowLeft</Code>, <Code>ChevronRight</Code>, <Code>ChevronDown</Code>, <Code>Check</Code>, <Code>X</Code>, <Code>Search</Code>, <Code>Lock</Code>, <Code>Unlock</Code>, <Code>AlertTriangle</Code>, <Code>Info</Code>, <Code>Send</Code>, <Code>Bell</Code>, <Code>Calendar</Code>, <Code>Trash2</Code>, <Code>Pencil</Code>, <Code>SlidersHorizontal</Code>, <Code>Eye</Code>, <Code>Star</Code>.
          Default props: size 18 in inputs/nav, 16 in chips, 20 in headers; <Code>strokeWidth</Code> 1.6.
        </Note>
        <Note heading="Paper texture">
          Single utility — apply to every cream surface:
          <div style={{ marginTop: 4 }}>
            <Code>.bg-ticket{'{'}background-color:#f6efdb; background-image: radial-gradient(rgba(0,0,0,.04) 1px,transparent 1px), radial-gradient(rgba(0,0,0,.025) 1px,transparent 1px); background-size:3px 3px,7px 7px; background-position:0 0,1.5px 1.5px;{'}'}</Code>
          </div>
        </Note>
        <Note heading="Perforation tear">
          Composed: 1.5px dashed ink-20 horizontal rule, with 20px circle notches absolutely positioned at left:-10 / right:-10, filled with the parent page color (paper) so the tear reads as a hole-punch, not a stroke.
        </Note>
        <Note heading="Routing & state">
          App is split by phase: PRE_NAV (home / my list / draw / chat / players) before the tournament; LIVE_NAV (home / standings / predict / chat / players) after. The switch is server-driven by /lists locked=true.
          Predictions are PUT debounced 300ms. SaveBadge owns the resulting state — no toast.
        </Note>
        <Note heading="Accessibility">
          All buttons reachable by keyboard; <Code>:focus-visible</Code> ring (3px ink @ 18%) only — not on hover. Mono caps are visually decorative; reading order uses the underlying word (eg "Live" not "★ Live").
          <Code>aria-live=&quot;polite&quot;</Code> on Save Badge, toast region, and chat new-message announcer. Reduced-motion swaps spinner for static dot.
        </Note>
        <Note heading="What NOT to add">
          No tablet/desktop layout, no marketing page, no settings catch-all, no dark mode (paper theme is the brand), no FIFA marks. The product is a focused tournament-only PWA.
        </Note>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════ EXPORTS

Object.assign(window, {
  FNOutcomeCell, FNOutcomeRow, FNProgress, FNProgressIndeterminate,
  FNStatusPill, FNChatBubble,
  OutcomeBoard, ProgressBoard, ChatBoard,
  InteractionSpecBoard, MotionBoard, StateMatrixBoard,
  ResponsiveBoard, ImplBoard,
});
