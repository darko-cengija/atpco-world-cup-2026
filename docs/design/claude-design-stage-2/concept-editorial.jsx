// Concept 1 — "Editorial Bold"
// Newspaper sports-section aesthetic. Warm paper, ink black, ember accent.
// Big serif display + tight sans body + mono dates. Strong hairline rules.

const C1 = {
  paper:  '#f3ede1',
  paper2: '#ebe4d4',
  ink:    '#1a1815',
  ink60:  'rgba(26,24,21,0.6)',
  ink40:  'rgba(26,24,21,0.4)',
  rule:   'rgba(26,24,21,0.2)',
  ember:  '#c8362b',
  serif:  '"Instrument Serif", "Times New Roman", serif',
  sans:   '"Inter Tight", "Helvetica Neue", system-ui, sans-serif',
  mono:   '"JetBrains Mono", ui-monospace, monospace',
};

function C1Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 20px 14px', fontFamily: C1.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: C1.ink,
          color: C1.paper, display: 'grid', placeItems: 'center',
          fontFamily: C1.serif, fontSize: 18, lineHeight: 1, fontStyle: 'italic',
          paddingBottom: 2,
        }}>W</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.6,
          color: C1.ink, textTransform: 'uppercase' }}>World Cup 26</div>
      </div>
      <Avatar initial="D" size={32} bg={C1.ink} fg={C1.paper} />
    </div>
  );
}

function C1Hero() {
  return (
    <div style={{ padding: '4px 20px 14px', fontFamily: C1.serif }}>
      <div style={{
        fontFamily: C1.sans, fontSize: 10, fontWeight: 600,
        letterSpacing: 2, color: C1.ember, marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 18, height: 1, background: C1.ember }} />
        ISSUE 01 · GROUP STAGE
      </div>
      <div style={{
        fontSize: 56, lineHeight: 0.95, color: C1.ink, letterSpacing: -1.2,
        fontWeight: 400,
      }}>
        Upcoming<br/>
        <span style={{ fontStyle: 'italic' }}>Matches.</span>
      </div>
      <div style={{
        marginTop: 14, display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between',
        fontFamily: C1.mono, fontSize: 11, color: C1.ink60,
        letterSpacing: 0.4, textTransform: 'uppercase',
      }}>
        <span>The Pool · 14 players</span>
        <span>3 to predict</span>
      </div>
    </div>
  );
}

function C1Match({ m }) {
  const predicted = m.predicted != null;
  return (
    <div style={{
      padding: '18px 20px 20px', position: 'relative',
      borderTop: `1px solid ${C1.rule}`,
    }}>
      {/* Date column + venue row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <div style={{
            fontFamily: C1.serif, fontSize: 40, lineHeight: 0.85,
            color: C1.ink, fontWeight: 400,
          }}>{m.dayNum}</div>
          <div style={{ fontFamily: C1.mono, fontSize: 10.5,
            color: C1.ink60, letterSpacing: 0.6, lineHeight: 1.4,
            textTransform: 'uppercase', paddingTop: 2,
          }}>
            <div>{m.monthShort} · {m.dayShort.split(', ')[0]}</div>
            <div style={{ color: C1.ink }}>{m.time}</div>
          </div>
        </div>
        <div style={{
          fontFamily: C1.sans, fontSize: 10.5, color: C1.ink60,
          textAlign: 'right', maxWidth: 130, lineHeight: 1.3,
        }}>
          {m.venue}<br/>
          <span style={{ color: C1.ink40 }}>{m.city}</span>
        </div>
      </div>

      {/* Matchup */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 10, marginBottom: 14,
      }}>
        {/* HOME */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FlagSquare code={m.home.code} size={42} radius={6} />
          <div style={{ fontFamily: C1.serif, fontSize: 22,
            color: C1.ink, lineHeight: 1, letterSpacing: -0.3 }}>
            {m.home.name}
          </div>
          <div style={{ fontFamily: C1.sans, fontSize: 11,
            color: C1.ink60, fontStyle: 'italic' }}>
            owned by {m.home.owner}
          </div>
        </div>
        {/* VS */}
        <div style={{
          fontFamily: C1.serif, fontStyle: 'italic',
          fontSize: 26, color: C1.ember, lineHeight: 1,
          padding: '0 6px',
        }}>vs</div>
        {/* AWAY */}
        <div style={{ display: 'flex', flexDirection: 'column',
          gap: 6, alignItems: 'flex-end', textAlign: 'right' }}>
          <FlagSquare code={m.away.code} size={42} radius={6} />
          <div style={{ fontFamily: C1.serif, fontSize: 22,
            color: C1.ink, lineHeight: 1, letterSpacing: -0.3 }}>
            {m.away.name}
          </div>
          <div style={{ fontFamily: C1.sans, fontSize: 11,
            color: C1.ink60, fontStyle: 'italic' }}>
            owned by {m.away.owner}
          </div>
        </div>
      </div>

      {/* CTA */}
      {predicted ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: `1px solid ${C1.rule}`,
          background: 'transparent', borderRadius: 2,
          fontFamily: C1.sans,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: C1.ink, color: C1.paper,
              display: 'grid', placeItems: 'center',
              fontFamily: C1.serif, fontSize: 14, fontStyle: 'italic',
            }}>✓</span>
            <span style={{ fontSize: 13, color: C1.ink }}>
              You picked <strong style={{ fontWeight: 700 }}>Korea</strong>
            </span>
          </div>
          <span style={{ fontSize: 12, color: C1.ember,
            textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Edit pick
          </span>
        </div>
      ) : (
        <button style={{
          width: '100%', padding: '13px 16px', border: 'none',
          background: C1.ink, color: C1.paper,
          fontFamily: C1.sans, fontSize: 13, fontWeight: 600,
          letterSpacing: 1.4, textTransform: 'uppercase',
          borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}>
          <span>Make your prediction</span>
          <span style={{ fontFamily: C1.serif, fontStyle: 'italic',
            fontSize: 18, letterSpacing: 0 }}>→</span>
        </button>
      )}
    </div>
  );
}

function C1FinishedLink() {
  return (
    <div style={{
      borderTop: `1px solid ${C1.rule}`,
      borderBottom: `1px solid ${C1.rule}`,
      padding: '14px 20px', margin: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: C1.sans,
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: C1.ink40,
          letterSpacing: 1.4, textTransform: 'uppercase' }}>Archive</div>
        <div style={{ fontFamily: C1.serif, fontStyle: 'italic',
          fontSize: 20, color: C1.ink, marginTop: 2 }}>
          Finished matches
        </div>
      </div>
      <span style={{
        fontFamily: C1.serif, fontStyle: 'italic',
        fontSize: 26, color: C1.ink, lineHeight: 1,
      }}>→</span>
    </div>
  );
}

function C1Nav() {
  return (
    <div style={{
      background: C1.paper, borderTop: `1px solid ${C1.rule}`,
      padding: '8px 8px 12px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      fontFamily: C1.sans,
    }}>
      {NAV_ITEMS.map(item => {
        const color = item.active ? C1.ink : C1.ink40;
        return (
          <div key={item.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, color, padding: '4px 6px', position: 'relative', minWidth: 50,
          }}>
            {item.active && (
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                width: 22, height: 2, background: C1.ember,
              }} />
            )}
            <div style={{ width: 22, height: 22 }}>{NAV_ICONS[item.id]}</div>
            <div style={{ fontSize: 9.5, fontWeight: item.active ? 600 : 500,
              letterSpacing: 0.6, textTransform: 'uppercase' }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function ConceptEditorial() {
  return (
    <Phone bg={C1.paper} statusColor={C1.ink}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <C1Header />
        <C1Hero />
        {MATCHES.map(m => <C1Match key={m.id} m={m} />)}
        <C1FinishedLink />
        <div style={{ height: 12 }} />
      </div>
      <C1Nav />
      <div style={{ height: 24, background: C1.paper }} />
    </Phone>
  );
}

Object.assign(window, { ConceptEditorial });
