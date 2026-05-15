// Concept 3 — "Match Ticket"
// Each match is a physical-feeling ticket stub: perforated edges,
// dashed tear-line, monospace numerals, stamped CTA. Aged paper bg.

const C3 = {
  paper:    '#e6dcc5',   // outer page (kraft)
  ticket:   '#f6efdb',   // ticket body (lighter cream)
  ink:      '#0f3a35',   // deep teal-ink
  ink70:    'rgba(15,58,53,0.7)',
  ink50:    'rgba(15,58,53,0.5)',
  ink20:    'rgba(15,58,53,0.2)',
  stamp:    '#a8392b',   // stamp red
  stampInk: '#7a2b20',
  gold:     '#b3892e',
  mono:     '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
  display:  '"DM Serif Display", "Times New Roman", serif',
  sans:     '"Inter Tight", "Helvetica Neue", system-ui, sans-serif',
};

// Subtle paper texture overlay rendered with a gradient — no images.
function paperTexture(color) {
  return {
    backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                      radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
    backgroundSize: '3px 3px, 7px 7px',
    backgroundPosition: '0 0, 1.5px 1.5px',
    backgroundColor: color,
  };
}

function C3Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 20px 10px', fontFamily: C3.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, border: `2px solid ${C3.ink}`,
          borderRadius: 8, padding: 2,
          display: 'grid', placeItems: 'center',
          background: 'transparent',
        }}>
          <div style={{
            width: '100%', height: '100%', border: `1px solid ${C3.ink70}`,
            borderRadius: 4, display: 'grid', placeItems: 'center',
            fontFamily: C3.display, fontSize: 14, color: C3.ink, lineHeight: 1,
          }}>26</div>
        </div>
        <div>
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase' }}>Pool · admit one</div>
          <div style={{ fontFamily: C3.display, fontSize: 15, color: C3.ink,
            lineHeight: 1, marginTop: 1 }}>World Cup 26</div>
        </div>
      </div>
      <Avatar initial="D" size={32} bg={C3.ink} fg={C3.ticket} ring={C3.paper} />
    </div>
  );
}

function C3Hero() {
  return (
    <div style={{ padding: '6px 20px 16px' }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>★</span> Group Stage
        <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        <span style={{ color: C3.ink50 }}>3 fixtures</span>
      </div>
      <div style={{
        fontFamily: C3.display, fontSize: 42, lineHeight: 1,
        color: C3.ink, letterSpacing: -0.5,
      }}>
        Upcoming<br/>matches
      </div>
    </div>
  );
}

// Ticket card with perforation notches + dashed tear line.
function C3Match({ m }) {
  const predicted = m.predicted != null;
  // The notch row sits ~74px from the top of the card body (after the date
  // header strip). Notch radius 9. The notches are paper-colored disks
  // overlapping the card edges; the dashed line spans between them.
  return (
    <div style={{
      margin: '0 16px 16px',
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden',
      fontFamily: C3.sans,
    }}>
      {/* Top strip: date / time / venue */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: `1px solid ${C3.ink20}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, position: 'relative',
      }}>
        <div>
          <div style={{ fontFamily: C3.mono, fontSize: 10,
            color: C3.ink50, letterSpacing: 1.2,
            textTransform: 'uppercase' }}>Kick-off</div>
          <div style={{ fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1, marginTop: 2 }}>{m.dayShort.split(', ')[1]}</div>
          <div style={{ fontFamily: C3.mono, fontSize: 12, color: C3.ink,
            letterSpacing: 0.5, marginTop: 3 }}>{m.time24} · {m.dayShort.split(', ')[0]}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: C3.mono, fontSize: 10,
            color: C3.ink50, letterSpacing: 1.2,
            textTransform: 'uppercase' }}>Venue</div>
          <div style={{ fontFamily: C3.sans, fontSize: 13, color: C3.ink,
            fontWeight: 600, marginTop: 4, lineHeight: 1.15, maxWidth: 150 }}>
            {m.venue}
          </div>
          <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
            marginTop: 2, letterSpacing: 0.5 }}>{m.city.toUpperCase()}</div>
        </div>
      </div>

      {/* Notches + tear line (purely decorative) */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{
          position: 'absolute', left: -10, top: -10,
          width: 20, height: 20, borderRadius: '50%', background: C3.paper,
        }} />
        <div style={{
          position: 'absolute', right: -10, top: -10,
          width: 20, height: 20, borderRadius: '50%', background: C3.paper,
        }} />
        <div style={{
          position: 'absolute', left: 14, right: 14, top: -1,
          borderTop: `1.5px dashed ${C3.ink20}`,
        }} />
      </div>

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
              lineHeight: 1.05, letterSpacing: -0.2, marginTop: 2 }}>
              {m.home.name}
            </div>
            <div style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink70,
              marginTop: 4, fontWeight: 500 }}>
              <span style={{ color: C3.ink50 }}>player</span> {m.home.owner}
            </div>
          </div>
        </div>
        {/* VS */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `1.5px solid ${C3.ink}`, color: C3.ink,
          display: 'grid', placeItems: 'center',
          fontFamily: C3.display, fontSize: 14, letterSpacing: 0.5,
          background: C3.ticket,
        }}>vs</div>
        {/* AWAY */}
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', textAlign: 'right', gap: 8 }}>
          <FlagSquare code={m.away.code} size={52} radius={4} />
          <div>
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>Away · {m.away.short}</div>
            <div style={{ fontFamily: C3.display, fontSize: 19, color: C3.ink,
              lineHeight: 1.05, letterSpacing: -0.2, marginTop: 2 }}>
              {m.away.name}
            </div>
            <div style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink70,
              marginTop: 4, fontWeight: 500 }}>
              <span style={{ color: C3.ink50 }}>player</span> {m.away.owner}
            </div>
          </div>
        </div>
      </div>

      {/* Stamped CTA */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Match #{String(m.id).padStart(3,'0')}<br/>
          <span style={{ color: C3.ink70 }}>Code {m.home.short}-{m.away.short}</span>
        </div>
        {predicted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '6px 10px',
              border: `2px solid ${C3.stamp}`,
              color: C3.stamp,
              transform: 'rotate(-3deg)',
              fontFamily: C3.display, fontSize: 14, letterSpacing: 1,
              textTransform: 'uppercase',
              borderRadius: 3,
            }}>Predicted · 1</div>
            <button style={{
              padding: '8px 12px', background: 'transparent',
              border: `1px solid ${C3.ink}`, color: C3.ink,
              borderRadius: 4, fontFamily: C3.mono, fontSize: 10,
              letterSpacing: 1.4, textTransform: 'uppercase', cursor: 'pointer',
            }}>Edit</button>
          </div>
        ) : (
          <button style={{
            padding: '11px 16px', border: 'none',
            background: C3.ink, color: C3.ticket,
            fontFamily: C3.mono, fontSize: 11, letterSpacing: 1.6,
            textTransform: 'uppercase', cursor: 'pointer',
            borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 600,
          }}>
            Predict
            <span style={{ fontFamily: C3.display, letterSpacing: 0 }}>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

function C3FinishedLink() {
  return (
    <div style={{
      margin: '4px 16px 16px',
      padding: '14px 16px',
      border: `1.5px dashed ${C3.ink20}`,
      borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: C3.sans, color: C3.ink,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 4,
          border: `2px solid ${C3.gold}`, color: C3.gold,
          display: 'grid', placeItems: 'center',
          fontFamily: C3.display, fontSize: 14, letterSpacing: 0.5,
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

function C3Nav() {
  return (
    <div style={{
      ...paperTexture(C3.paper),
      borderTop: `1px solid ${C3.ink20}`,
      padding: '8px 4px 10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      fontFamily: C3.mono,
    }}>
      {NAV_ITEMS.map(item => {
        const color = item.active ? C3.stamp : C3.ink70;
        return (
          <div key={item.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, color, padding: '4px 6px', position: 'relative', minWidth: 50,
          }}>
            <div style={{ width: 22, height: 22 }}>{NAV_ICONS[item.id]}</div>
            <div style={{ fontSize: 9, fontWeight: 500,
              letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</div>
            {item.active && (
              <div style={{
                position: 'absolute', bottom: -2, left: '50%',
                transform: 'translateX(-50%)',
                width: 16, height: 2, background: C3.stamp,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConceptTicket() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <C3Header />
        <C3Hero />
        {MATCHES.map(m => <C3Match key={m.id} m={m} />)}
        <C3FinishedLink />
      </div>
      <C3Nav />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, { ConceptTicket });
