// Concept 2 — "Playful Pop"
// Friendly chunky cards, warm cream bg, tomato + navy accents.
// Round flag chips as the visual anchor. Cards float with soft shadows.

const C2 = {
  cream:  '#FFF6E7',
  cream2: '#FFEFD3',
  navy:   '#0E2342',
  navy70: 'rgba(14,35,66,0.7)',
  navy50: 'rgba(14,35,66,0.5)',
  navy12: 'rgba(14,35,66,0.12)',
  tomato: '#FF4F3A',
  tomato2:'#FFD9D1',
  lime:   '#C8E96B',
  sun:    '#FFC53D',
  card:   '#FFFFFF',
  display:'"Bricolage Grotesque", "Helvetica Neue", system-ui, sans-serif',
  sans:   '"Inter Tight", "Helvetica Neue", system-ui, sans-serif',
};

function C2Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 18px 10px', fontFamily: C2.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: C2.navy,
          color: C2.cream, display: 'grid', placeItems: 'center',
          fontFamily: C2.display, fontWeight: 700, fontSize: 14,
          letterSpacing: -0.5, lineHeight: 1,
          boxShadow: `inset -2px -2px 0 ${C2.tomato}`,
        }}>
          <span style={{ marginTop: -1 }}>26</span>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: C2.navy50,
            letterSpacing: 1, textTransform: 'uppercase' }}>Pool</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C2.navy,
            lineHeight: 1.1, marginTop: 1 }}>World Cup 26</div>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C2.card, borderRadius: 999, padding: '4px 4px 4px 12px',
        boxShadow: `0 1px 0 ${C2.navy12}, 0 2px 8px rgba(14,35,66,0.06)`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C2.navy }}>Darko</span>
        <Avatar initial="D" size={26} bg={C2.tomato} fg="#fff" />
      </div>
    </div>
  );
}

function C2Hero() {
  return (
    <div style={{ padding: '10px 20px 18px', fontFamily: C2.display }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: C2.sans, fontSize: 11, fontWeight: 700,
        color: C2.tomato, letterSpacing: 0.8, textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: C2.tomato }} />
        World Cup 26
        <span style={{ color: C2.navy50, fontWeight: 600 }}>· Group stage</span>
      </div>
      <div style={{
        fontSize: 38, lineHeight: 1, color: C2.navy, fontWeight: 600,
        letterSpacing: -1.4,
      }}>
        Upcoming<br/>matches
        <span style={{ color: C2.tomato }}>.</span>
      </div>
      <div style={{
        marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap',
        fontFamily: C2.sans, fontSize: 12, fontWeight: 600,
      }}>
        <div style={{ padding: '6px 12px', borderRadius: 999,
          background: C2.navy, color: C2.cream }}>
          ⬤ 2 to predict
        </div>
        <div style={{ padding: '6px 12px', borderRadius: 999,
          background: C2.cream2, color: C2.navy70 }}>
          1 done
        </div>
      </div>
    </div>
  );
}

function C2Owner({ name, side = 'left' }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: C2.sans, fontSize: 10.5, fontWeight: 600,
      color: C2.navy70, marginTop: 4,
    }}>
      <Avatar initial={name[0]} size={16} bg={C2.cream2} fg={C2.navy} />
      <span>{name}</span>
    </div>
  );
}

function C2Match({ m }) {
  const predicted = m.predicted != null;
  const accent = predicted ? C2.lime : C2.tomato;
  return (
    <div style={{
      background: C2.card, borderRadius: 24,
      margin: '0 18px 14px', padding: '16px 16px 14px',
      boxShadow: `0 1px 0 ${C2.navy12}, 0 6px 18px rgba(14,35,66,0.07)`,
      fontFamily: C2.sans, position: 'relative', overflow: 'hidden',
    }}>
      {/* meta */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px 4px 8px', borderRadius: 999,
          background: C2.cream2, color: C2.navy,
          fontSize: 11, fontWeight: 700,
        }}>
          <span style={{ width: 14, height: 14, borderRadius: 4,
            background: C2.navy, color: C2.cream,
            display: 'grid', placeItems: 'center',
            fontSize: 8, fontWeight: 700, letterSpacing: 0.3,
          }}>{m.dayNum}</span>
          {m.dayShort} · {m.time}
        </div>
        <div style={{ fontSize: 11, color: C2.navy50, fontWeight: 500,
          maxWidth: 130, textAlign: 'right', lineHeight: 1.2 }}>
          📍 {m.venue}
        </div>
      </div>

      {/* matchup */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 6, marginBottom: 14,
      }}>
        {/* HOME */}
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', gap: 4 }}>
          <FlagCircle code={m.home.code} size={56} ring={C2.cream} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C2.navy,
            letterSpacing: -0.2, lineHeight: 1.1, marginTop: 4 }}>
            {m.home.name}
          </div>
          <C2Owner name={m.home.owner} />
        </div>
        {/* VS */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: C2.cream, color: C2.navy,
          display: 'grid', placeItems: 'center',
          fontFamily: C2.display, fontWeight: 700, fontSize: 16,
          letterSpacing: -0.5,
          boxShadow: `inset 0 0 0 2px ${C2.navy}`,
          transform: 'translateY(-6px)',
        }}>VS</div>
        {/* AWAY */}
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', gap: 4 }}>
          <FlagCircle code={m.away.code} size={56} ring={C2.cream} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C2.navy,
            letterSpacing: -0.2, lineHeight: 1.1, marginTop: 4 }}>
            {m.away.name}
          </div>
          <C2Owner name={m.away.owner} />
        </div>
      </div>

      {/* CTA */}
      {predicted ? (
        <div style={{
          display: 'flex', alignItems: 'stretch', gap: 8,
        }}>
          <div style={{
            flex: 1, padding: '10px 14px', borderRadius: 14,
            background: C2.cream2,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 10, color: C2.navy50, fontWeight: 600,
                letterSpacing: 0.4, textTransform: 'uppercase' }}>You predicted</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C2.navy,
                marginTop: 2 }}>Korea wins 1–0</div>
            </div>
          </div>
          <button style={{
            padding: '0 18px', borderRadius: 14, border: 'none',
            background: C2.navy, color: C2.cream,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: C2.sans,
          }}>Edit</button>
        </div>
      ) : (
        <button style={{
          width: '100%', padding: '14px 16px', border: 'none',
          background: accent, color: '#fff',
          fontSize: 14, fontWeight: 700, letterSpacing: -0.1,
          borderRadius: 16, cursor: 'pointer', fontFamily: C2.sans,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 4px 0 ${C2.navy}`,
        }}>
          <span style={{ fontSize: 16 }}>⚽</span>
          Make a prediction
        </button>
      )}
    </div>
  );
}

function C2FinishedLink() {
  return (
    <div style={{
      margin: '4px 18px 14px', padding: '12px 16px',
      borderRadius: 16, fontFamily: C2.sans,
      border: `1.5px dashed ${C2.navy12}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      color: C2.navy,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🏁</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Finished matches</div>
          <div style={{ fontSize: 11, color: C2.navy50 }}>See results & scores</div>
        </div>
      </div>
      <span style={{ fontSize: 18 }}>→</span>
    </div>
  );
}

function C2Nav() {
  return (
    <div style={{
      padding: '8px 14px 12px', background: 'transparent',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: C2.navy, borderRadius: 24, padding: 6,
        boxShadow: `0 8px 24px rgba(14,35,66,0.25)`,
        fontFamily: C2.sans,
      }}>
        {NAV_ITEMS.map(item => {
          if (item.active) {
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: C2.tomato, color: '#fff',
                borderRadius: 18, padding: '8px 14px',
                fontSize: 12, fontWeight: 700,
              }}>
                <div style={{ width: 16, height: 16 }}>{NAV_ICONS[item.id]}</div>
                {item.label}
              </div>
            );
          }
          return (
            <div key={item.id} style={{
              width: 44, height: 36, borderRadius: 14,
              display: 'grid', placeItems: 'center',
              color: 'rgba(255,255,255,0.55)',
            }}>
              <div style={{ width: 20, height: 20 }}>{NAV_ICONS[item.id]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConceptPop() {
  return (
    <Phone bg={C2.cream} statusColor={C2.navy}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 4 }}>
        <C2Header />
        <C2Hero />
        {MATCHES.map(m => <C2Match key={m.id} m={m} />)}
        <C2FinishedLink />
      </div>
      <C2Nav />
      <div style={{ height: 22 }} />
    </Phone>
  );
}

Object.assign(window, { ConceptPop });
