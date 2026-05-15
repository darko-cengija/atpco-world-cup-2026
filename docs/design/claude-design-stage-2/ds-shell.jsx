// App shell, headers, and bottom nav for the Match Ticket system.
// Two nav variants: Live Competition + Pre-Draw.
// Components: TopBar, BackHeader, BottomNav, NavTab, ChatUnreadBadge.

// Extra nav icons specific to the two app phases.
const NAV_ICONS_EXT = {
  ...NAV_ICONS,
  mylist: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 8.5h10M7 12h10M7 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="18.5" cy="15.5" r="0.9" fill="currentColor"/>
    </svg>
  ),
  draw: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 7v10c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5V7" stroke="currentColor" strokeWidth="1.6"/>
      <ellipse cx="12" cy="7" rx="6" ry="2.2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 12.5l-1.6-2.8h3.2L12 12.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
};

const LIVE_NAV = [
  { id: 'home',        label: 'Home'        },
  { id: 'standings',   label: 'Standings'   },
  { id: 'predictions', label: 'Predict',    primary: true },
  { id: 'chat',        label: 'Chat',       unread: 'count', count: 3 },
  { id: 'players',     label: 'Players'     },
];

const PRE_NAV = [
  { id: 'home',    label: 'Home'    },
  { id: 'mylist',  label: 'My List' },
  { id: 'draw',    label: 'Draw',   primary: true },
  { id: 'chat',    label: 'Chat',   unread: 'dot' },
  { id: 'players', label: 'Players' },
];

// ───────────────────────────────────────────────── Logo mark
function LogoMark({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${C3.ink}`,
      borderRadius: 8, padding: 2,
      display: 'grid', placeItems: 'center', background: 'transparent',
      flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', border: `1px solid ${C3.ink70}`,
        borderRadius: 4, display: 'grid', placeItems: 'center',
        fontFamily: C3.display, fontSize: size * 0.37, color: C3.ink, lineHeight: 1,
      }}>26</div>
    </div>
  );
}

// ───────────────────────────────────────────────── Top app bar
function TopBar({ avatar = 'D' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 20px 10px', fontFamily: C3.sans,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LogoMark />
        <div>
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase' }}>Pool · admit one</div>
          <div style={{ fontFamily: C3.display, fontSize: 15, color: C3.ink,
            lineHeight: 1, marginTop: 1 }}>World Cup 26</div>
        </div>
      </div>
      <Avatar initial={avatar} size={32} bg={C3.ink} fg={C3.ticket} ring={C3.paper} />
    </div>
  );
}

// ───────────────────────────────────────────────── Back header
function BackHeader({ title, eyebrow, statusIcon, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 14px 12px', fontFamily: C3.sans,
    }}>
      <button aria-label="Back" style={{
        width: 36, height: 36, borderRadius: 8, border: `1px solid ${C3.ink20}`,
        background: 'transparent', color: C3.ink,
        display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0,
        flexShrink: 0,
      }}>
        <div style={{ width: 20, height: 20 }}>{ICONS.back}</div>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', lineHeight: 1,
          }}>{eyebrow}</div>
        )}
        <div style={{
          fontFamily: C3.display, fontSize: 19, color: C3.ink,
          lineHeight: 1.1, letterSpacing: -0.2, marginTop: eyebrow ? 3 : 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
      </div>
      {statusIcon && (
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'grid', placeItems: 'center', color: C3.ink70,
          border: `1px dashed ${C3.ink20}`, flexShrink: 0,
        }}>
          <div style={{ width: 18, height: 18 }}>{ICONS[statusIcon]}</div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────── Chat unread badge
function ChatUnreadBadge({ kind, count }) {
  if (kind === 'dot') {
    return (
      <span style={{
        position: 'absolute', top: -2, right: -4,
        width: 8, height: 8, borderRadius: '50%',
        background: C3.stamp, boxShadow: `0 0 0 2px ${C3.paper}`,
      }} />
    );
  }
  if (kind === 'count') {
    const label = count > 99 ? '99+' : String(count);
    return (
      <span style={{
        position: 'absolute', top: -5, right: -10,
        minWidth: 17, height: 16, padding: '0 4px',
        borderRadius: 8, background: C3.stamp, color: C3.ticket,
        fontFamily: C3.mono, fontSize: 9, fontWeight: 600, letterSpacing: 0.3,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 2px ${C3.paper}`,
      }}>{label}</span>
    );
  }
  return null;
}

// ───────────────────────────────────────────────── Single nav tab
function NavTab({ item, active, pressed }) {
  const color = active ? C3.stamp : (pressed ? C3.ink : C3.ink70);
  const opacity = pressed && !active ? 0.55 : 1;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3, color, padding: '4px 6px', position: 'relative', minWidth: 50,
      opacity, transition: 'opacity 120ms',
    }}>
      <div style={{ width: 22, height: 22, position: 'relative' }}>
        {NAV_ICONS_EXT[item.id]}
        {item.unread && <ChatUnreadBadge kind={item.unread} count={item.count} />}
      </div>
      <div style={{
        fontFamily: C3.mono, fontSize: 9, fontWeight: 500,
        letterSpacing: 1, textTransform: 'uppercase',
      }}>{item.label}</div>
      {active && (
        <div style={{
          position: 'absolute', bottom: -2, left: '50%',
          transform: 'translateX(-50%)',
          width: 16, height: 2, background: C3.stamp,
        }} />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────── Bottom nav
function BottomNav({ variant = 'live', activeId = 'home', pressedId }) {
  const items = (variant === 'pre' ? PRE_NAV : LIVE_NAV);
  return (
    <div style={{
      ...paperTexture(C3.paper),
      borderTop: `1px solid ${C3.ink20}`,
      padding: '8px 4px 10px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {items.map(item => (
        <NavTab
          key={item.id}
          item={item}
          active={item.id === activeId}
          pressed={item.id === pressedId}
        />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────── Full shell mockups
function ShellLive({ children }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        {children}
      </div>
      <BottomNav variant="live" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

function ShellPreDraw({ children }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        {children}
      </div>
      <BottomNav variant="pre" activeId="home" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

function ShellBack({ children, title, eyebrow, statusIcon }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title={title} eyebrow={eyebrow} statusIcon={statusIcon} />
        {children}
      </div>
      <BottomNav variant="live" activeId="predictions" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  LIVE_NAV, PRE_NAV, NAV_ICONS_EXT,
  LogoMark, TopBar, BackHeader, BottomNav, NavTab, ChatUnreadBadge,
  ShellLive, ShellPreDraw, ShellBack,
});
