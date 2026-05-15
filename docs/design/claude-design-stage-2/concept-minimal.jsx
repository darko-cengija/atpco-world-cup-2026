// Concept 4 — "Minimal Calendar"
// Time-first, day-grouped agenda. Swiss layout, monochrome with one
// electric accent. Sticky day headers. Helvetica + tabular numerals.

const C4 = {
  bg:      '#fafaf7',
  surface: '#ffffff',
  ink:     '#111111',
  ink70:   'rgba(17,17,17,0.62)',
  ink50:   'rgba(17,17,17,0.45)',
  ink20:   'rgba(17,17,17,0.18)',
  ink08:   'rgba(17,17,17,0.08)',
  accent:  '#5b3df5',   // electric indigo — the single accent
  sans:    '"Helvetica Neue", Helvetica, "Arial", system-ui, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
};

function C4Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 18px 8px', fontFamily: C4.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: C4.ink,
          color: C4.surface, display: 'grid', placeItems: 'center',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.1, lineHeight: 1,
        }}>26</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C4.ink,
          letterSpacing: -0.2 }}>World Cup 26</div>
      </div>
      <Avatar initial="D" size={28} bg={C4.ink} fg={C4.surface} />
    </div>
  );
}

function C4Hero() {
  return (
    <div style={{ padding: '14px 18px 12px', fontFamily: C4.sans }}>
      <div style={{
        fontSize: 11, fontWeight: 500, color: C4.ink50,
        letterSpacing: 0, marginBottom: 6,
      }}>World Cup 26</div>
      <div style={{
        fontSize: 30, lineHeight: 1.05, color: C4.ink,
        letterSpacing: -1, fontWeight: 700,
      }}>
        Upcoming matches
      </div>
      {/* Summary strip */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: `1px solid ${C4.ink08}`,
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 8, fontFamily: C4.sans,
      }}>
        {[
          ['Fixtures', '3'],
          ['To predict', '2'],
          ['Done', '1'],
        ].map(([k, v], i) => (
          <div key={k}>
            <div style={{ fontSize: 10, fontWeight: 500, color: C4.ink50,
              letterSpacing: 0.6, textTransform: 'uppercase' }}>{k}</div>
            <div style={{
              fontFamily: C4.mono, fontSize: 22, color: C4.ink,
              fontWeight: 500, marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function C4DayHeader({ day }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 2,
      background: C4.bg,
      padding: '14px 18px 8px',
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      fontFamily: C4.sans,
      borderBottom: `1px solid ${C4.ink08}`,
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: C4.ink, letterSpacing: -0.1,
      }}>{day}</div>
      <div style={{
        fontFamily: C4.mono, fontSize: 10, color: C4.ink50,
        letterSpacing: 0.6, textTransform: 'uppercase',
      }}>2026</div>
    </div>
  );
}

function C4Match({ m }) {
  const predicted = m.predicted != null;
  return (
    <div style={{
      background: C4.surface, padding: '14px 18px',
      borderBottom: `1px solid ${C4.ink08}`,
      fontFamily: C4.sans, position: 'relative',
    }}>
      {/* Time + venue header line */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: C4.mono, fontSize: 13, fontWeight: 500,
            color: C4.ink, letterSpacing: 0.2,
            fontVariantNumeric: 'tabular-nums',
          }}>{m.time24}</span>
          <span style={{
            fontSize: 11, fontWeight: 500, color: C4.ink70,
          }}>{m.venue} <span style={{ color: C4.ink50 }}>· {m.city}</span></span>
        </div>
        {!predicted && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: C4.accent,
            letterSpacing: 0.8, textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99,
              background: C4.accent }} />
            New
          </span>
        )}
      </div>

      {/* Two-team rows stacked. Time-agenda metaphor: each row is a list item. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9,
        marginBottom: 12 }}>
        {[m.home, m.away].map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <FlagSquare code={t.code} size={28} radius={4} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600,
                color: C4.ink, letterSpacing: -0.2, lineHeight: 1.1 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 11, color: C4.ink50, marginTop: 2 }}>
                <span style={{
                  fontFamily: C4.mono, letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}>{t.short}</span>
                <span style={{ margin: '0 6px', color: C4.ink20 }}>·</span>
                {t.owner}
              </div>
            </div>
            {i === 0 && (
              <span style={{ fontSize: 10, color: C4.ink50,
                fontFamily: C4.mono, letterSpacing: 0.8,
                textTransform: 'uppercase' }}>vs</span>
            )}
          </div>
        ))}
      </div>

      {/* Inline CTA */}
      {predicted ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', background: C4.bg,
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 16, height: 16, borderRadius: 4, background: C4.ink,
              color: C4.surface, display: 'grid', placeItems: 'center',
              fontSize: 10, fontWeight: 700,
            }}>✓</span>
            <span style={{ fontSize: 12, color: C4.ink }}>
              <span style={{ color: C4.ink50 }}>Predicted</span>
              <span style={{ margin: '0 6px' }}>·</span>
              <strong style={{ fontWeight: 600, fontFamily: C4.mono,
                fontVariantNumeric: 'tabular-nums' }}>1</strong>
            </span>
          </div>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: C4.sans, fontSize: 12, fontWeight: 600,
            color: C4.accent, padding: 0,
          }}>Edit</button>
        </div>
      ) : (
        <button style={{
          width: '100%', padding: '11px 14px', border: 'none',
          background: C4.ink, color: C4.surface,
          borderRadius: 8, fontFamily: C4.sans, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Predict</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 500, opacity: 0.7 }}>
            <span>⌘</span>P
          </span>
        </button>
      )}
    </div>
  );
}

function C4FinishedLink() {
  return (
    <button style={{
      width: 'calc(100% - 36px)', margin: '14px 18px',
      padding: '12px 14px', background: 'transparent',
      border: `1px solid ${C4.ink20}`, borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: C4.sans, color: C4.ink, cursor: 'pointer',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Finished matches</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: C4.mono, fontSize: 11,
          color: C4.ink50 }}>0 played</span>
        <span style={{ color: C4.ink50, fontSize: 14 }}>→</span>
      </span>
    </button>
  );
}

function C4Nav() {
  return (
    <div style={{
      background: C4.surface, borderTop: `1px solid ${C4.ink08}`,
      padding: '6px 4px 8px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      fontFamily: C4.sans,
    }}>
      {NAV_ITEMS.map(item => {
        const color = item.active ? C4.ink : C4.ink50;
        return (
          <div key={item.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, color, padding: '6px 6px', minWidth: 56,
            position: 'relative',
          }}>
            <div style={{ width: 22, height: 22 }}>{NAV_ICONS[item.id]}</div>
            <div style={{ fontSize: 10, fontWeight: item.active ? 700 : 500,
              letterSpacing: -0.1 }}>{item.label}</div>
            {item.active && (
              <div style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 4, height: 4, borderRadius: 99,
                background: C4.accent,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConceptMinimal() {
  // Group by day for sticky headers.
  const groups = {};
  MATCHES.forEach(m => {
    (groups[m.dayLong] ||= []).push(m);
  });
  return (
    <Phone bg={C4.bg} statusColor={C4.ink}>
      <div style={{ flex: 1, overflow: 'auto', background: C4.bg }}>
        <C4Header />
        <C4Hero />
        {Object.entries(groups).map(([day, ms]) => (
          <div key={day}>
            <C4DayHeader day={day} />
            {ms.map(m => <C4Match key={m.id} m={m} />)}
          </div>
        ))}
        <C4FinishedLink />
      </div>
      <C4Nav />
      <div style={{ height: 22, background: C4.surface }} />
    </Phone>
  );
}

Object.assign(window, { ConceptMinimal });
