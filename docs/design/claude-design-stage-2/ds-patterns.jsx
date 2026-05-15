// Patterns: banners, toasts, modal, bottom sheet, empty state,
// loading/skeleton, table/list rows.

// ─────────────────────────── BANNERS

function TKBanner({ tone = 'notice', title, body, action }) {
  const t = {
    success: { fg: '#1f6a4d', bg: 'rgba(31,106,77,0.08)',  icon: ICONS.check, label: 'Success' },
    notice:  { fg: C3.ink,    bg: 'rgba(15,58,53,0.06)',   icon: ICONS.info,  label: 'Notice'  },
    warning: { fg: C3.gold,   bg: 'rgba(179,137,46,0.12)', icon: ICONS.alert, label: 'Warning' },
    error:   { fg: C3.stamp,  bg: 'rgba(168,57,43,0.10)',  icon: ICONS.alert, label: 'Error'   },
  }[tone];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 14px', borderRadius: 6,
      background: t.bg, border: `1px solid ${t.fg}33`,
      borderLeft: `3px solid ${t.fg}`,
    }}>
      <span style={{ width: 18, height: 18, color: t.fg, flexShrink: 0,
        marginTop: 1 }}>{t.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: t.fg,
          letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
        }}>{t.label} · {title}</div>
        {body && (
          <div style={{
            fontFamily: C3.sans, fontSize: 12, color: C3.ink, marginTop: 4,
            lineHeight: 1.4,
          }}>{body}</div>
        )}
      </div>
      {action && (
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.fg, fontFamily: C3.mono, fontSize: 10, fontWeight: 600,
          letterSpacing: 1.4, textTransform: 'uppercase', padding: 0, flexShrink: 0,
        }}>{action}</button>
      )}
    </div>
  );
}

// ─────────────────────────── TOAST

function TKToast({ tone = 'success', text }) {
  const t = {
    success: { fg: C3.ticket, bg: '#1f6a4d',   icon: ICONS.check },
    notice:  { fg: C3.ticket, bg: C3.ink,      icon: ICONS.info  },
    error:   { fg: C3.ticket, bg: C3.stamp,    icon: ICONS.alert },
  }[tone];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '10px 14px 10px 12px', borderRadius: 6,
      background: t.bg, color: t.fg,
      boxShadow: '0 12px 28px rgba(40,25,8,0.22), 0 1px 0 rgba(255,255,255,0.10) inset',
      fontFamily: C3.sans, fontSize: 13, fontWeight: 500,
      maxWidth: 320,
    }}>
      <span style={{ width: 16, height: 16, flexShrink: 0 }}>{t.icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ─────────────────────────── EMPTY STATE

function TKEmpty({ title, body, action }) {
  return (
    <div style={{
      padding: 22, textAlign: 'center',
      border: `1.5px dashed ${C3.ink20}`, borderRadius: 12,
      background: 'transparent',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        border: `2px dashed ${C3.ink20}`, margin: '0 auto 12px',
        display: 'grid', placeItems: 'center', color: C3.ink50,
        fontFamily: C3.display, fontSize: 28, lineHeight: 1,
      }}>✕</div>
      <div style={{
        fontFamily: C3.display, fontSize: 20, color: C3.ink,
        lineHeight: 1.15, textWrap: 'pretty',
      }}>{title}</div>
      {body && (
        <div style={{
          fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
          marginTop: 6, lineHeight: 1.5,
        }}>{body}</div>
      )}
      {action && (
        <div style={{ marginTop: 14 }}>
          <TKButton variant="secondary" size="sm">{action}</TKButton>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── LOADING

function TKSpinner({ color = C3.ink, size = 24, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
      color, fontFamily: C3.mono, fontSize: 9, letterSpacing: 1.4,
      textTransform: 'uppercase' }}>
      {ICONS.spinner(color, size)}
      {label && <span>{label}</span>}
    </div>
  );
}

// Skeleton ticket — same silhouette as TicketCard but blocked out.
function TKSkeletonTicket() {
  const bar = (w, h = 10) => (
    <span style={{
      display: 'inline-block', width: w, height: h, borderRadius: 2,
      background: 'rgba(15,58,53,0.08)',
    }} />
  );
  return (
    <div style={{
      borderRadius: 16, ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', position: 'relative',
      animation: 'tkPulse 1.6s ease-in-out infinite',
    }}>
      <div style={{
        padding: '14px 18px 12px', borderBottom: `1px solid ${C3.ink20}`,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bar(48, 8)}{bar(70, 16)}{bar(90, 9)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {bar(36, 8)}{bar(110, 11)}{bar(70, 9)}
        </div>
      </div>
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: -1, borderTop: `1.5px dashed ${C3.ink20}` }} />
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 6, padding: '20px 16px 14px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ width: 52, height: 34, borderRadius: 4, background: 'rgba(15,58,53,0.08)' }} />
          {bar(36, 8)}{bar(120, 14)}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C3.ink20}` }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <span style={{ width: 52, height: 34, borderRadius: 4, background: 'rgba(15,58,53,0.08)' }} />
          {bar(36, 8)}{bar(110, 14)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── MODAL DIALOG

function TKModal({ title, body, primary = 'Confirm', secondary = 'Cancel', tone = 'primary' }) {
  return (
    <div style={{
      position: 'relative', width: 340,
      borderRadius: 14, ...paperTexture(C3.ticket),
      boxShadow: '0 20px 50px rgba(20,10,0,0.32)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      <div style={{ padding: '18px 20px 6px' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.6, textTransform: 'uppercase',
        }}>★ Confirm</div>
        <div style={{
          fontFamily: C3.display, fontSize: 22, color: C3.ink,
          lineHeight: 1.1, marginTop: 4, letterSpacing: -0.3, textWrap: 'pretty',
        }}>{title}</div>
      </div>
      <div style={{ padding: '8px 20px 18px',
        fontSize: 13, color: C3.ink70, lineHeight: 1.5 }}>
        {body}
      </div>
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px',
        display: 'flex', gap: 8, justifyContent: 'flex-end',
      }}>
        <TKButton variant="quiet" size="sm">{secondary}</TKButton>
        <TKButton variant={tone === 'destructive' ? 'destructive' : 'primary'}
          size="sm" trailing="→">{primary}</TKButton>
      </div>
    </div>
  );
}

// ─────────────────────────── BOTTOM SHEET

function TKBottomSheet({ title, items = [] }) {
  return (
    <div style={{
      width: 360, borderTopLeftRadius: 18, borderTopRightRadius: 18,
      ...paperTexture(C3.ticket),
      boxShadow: '0 -16px 40px rgba(20,10,0,0.20)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 0' }}>
        <span style={{ width: 38, height: 4, borderRadius: 2,
          background: C3.ink20 }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px 6px',
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.6, textTransform: 'uppercase',
          }}>Sheet</div>
          <div style={{
            fontFamily: C3.display, fontSize: 20, color: C3.ink,
            lineHeight: 1.05, marginTop: 2,
          }}>{title}</div>
        </div>
        <TKIconButton icon={ICONS.close} variant="quiet" size={32} />
      </div>
      <div style={{ borderTop: `1px dashed ${C3.ink20}` }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
            borderBottom: i < items.length - 1 ? `1px dashed ${C3.ink20}` : 'none',
            cursor: 'pointer',
          }}>
            {it.icon && (
              <span style={{
                width: 32, height: 32, borderRadius: 6,
                border: `1px solid ${C3.ink20}`,
                display: 'grid', placeItems: 'center',
                color: it.tone === 'destructive' ? C3.stamp : C3.ink,
              }}>
                <span style={{ width: 16, height: 16 }}>{it.icon}</span>
              </span>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: C3.sans, fontSize: 14, fontWeight: 600,
                color: it.tone === 'destructive' ? C3.stamp : C3.ink,
              }}>{it.label}</div>
              {it.hint && (
                <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                  letterSpacing: 0.8, marginTop: 2 }}>{it.hint}</div>
              )}
            </div>
            {it.right || (
              <span style={{ width: 16, height: 16, color: C3.ink50 }}>
                {ICONS.chevronRight}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── TABLE / LIST ROWS

// Standings row — rank + team + played/won/drawn/lost + points
function TKStandingRow({ rank, code, name, p, w, d, l, pts, highlight }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 22px 1fr repeat(4, 22px) 30px',
      alignItems: 'center', gap: 8,
      padding: '10px 14px',
      borderBottom: `1px solid ${C3.ink20}`,
      background: highlight ? 'rgba(168,57,43,0.06)' : 'transparent',
      fontFamily: C3.sans,
    }}>
      <span style={{
        fontFamily: C3.mono, fontSize: 11, color: highlight ? C3.stamp : C3.ink70,
        fontVariantNumeric: 'tabular-nums', letterSpacing: 0.4, fontWeight: 600,
      }}>{String(rank).padStart(2, '0')}</span>
      <span style={{ width: 22, height: 14, borderRadius: 2, overflow: 'hidden',
        boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)' }}>{FLAGS[code]}</span>
      <span style={{ fontFamily: C3.display, fontSize: 15, color: C3.ink,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      {[p, w, d, l].map((v, i) => (
        <span key={i} style={{
          fontFamily: C3.mono, fontSize: 11, color: C3.ink70,
          fontVariantNumeric: 'tabular-nums', textAlign: 'center',
        }}>{v}</span>
      ))}
      <span style={{
        fontFamily: C3.display, fontSize: 17, color: C3.ink, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>{pts}</span>
    </div>
  );
}

function TKStandingHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 22px 1fr repeat(4, 22px) 30px',
      alignItems: 'center', gap: 8,
      padding: '8px 14px',
      borderBottom: `1px solid ${C3.ink20}`,
      fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
      letterSpacing: 1.4, textTransform: 'uppercase',
    }}>
      <span>#</span><span></span><span>Team</span>
      <span style={{ textAlign: 'center' }}>P</span>
      <span style={{ textAlign: 'center' }}>W</span>
      <span style={{ textAlign: 'center' }}>D</span>
      <span style={{ textAlign: 'center' }}>L</span>
      <span style={{ textAlign: 'right' }}>Pts</span>
    </div>
  );
}

// Player leaderboard row
function TKPlayerRow({ rank, name, kind, initial, emoji, pts, predictions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderBottom: `1px solid ${C3.ink20}`,
      fontFamily: C3.sans,
    }}>
      <span style={{
        fontFamily: C3.mono, fontSize: 11, color: C3.ink70,
        fontVariantNumeric: 'tabular-nums', letterSpacing: 0.4,
        fontWeight: 600, width: 22,
      }}>{String(rank).padStart(2, '0')}</span>
      <TKAvatar kind={kind} initial={initial} emoji={emoji} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: C3.display, fontSize: 16, color: C3.ink,
          lineHeight: 1 }}>{name}</div>
        <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 0.8, marginTop: 3, textTransform: 'uppercase' }}>
          {predictions} predictions
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: C3.display, fontSize: 19, color: C3.ink,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pts}</div>
        <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase' }}>pts</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TKBanner, TKToast,
  TKEmpty, TKSpinner, TKSkeletonTicket,
  TKModal, TKBottomSheet,
  TKStandingRow, TKStandingHeader, TKPlayerRow,
});
